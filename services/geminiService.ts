
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { GeminiResponse } from "../types";
import { TEXT } from "../utils/common";

// Initialize the client. API key must be in environment variables.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.5-flash';
const TTS_MODEL_NAME = 'gemini-2.5-flash-preview-tts';

// Shared Schema parts
const BASE_SCHEMA_PROPERTIES = {
    japaneseKanji: { type: Type.STRING, description: "The complete, natural Japanese sentence in Kanji and Kana (plain text)." },
    japaneseHiragana: { type: Type.STRING, description: "The Japanese sentence purely in Hiragana for TTS playback." },
    romaji: { type: Type.STRING, description: "The Romanized version of the Japanese sentence." },
    japaneseFurigana: { type: Type.STRING, description: "The Japanese sentence formatted with HTML <ruby> and <rt> tags for furigana (Kanji only). EXAMPLE: <ruby>日<rt>に</rt></ruby><ruby>本<rt>ほん</rt></ruby>" },
    simplifiedChineseTranslation: { type: Type.STRING, description: "A short summary (max 10 characters) of the sentence." },
    chineseTranslation: { type: Type.STRING, description: "The Traditional Chinese translation of the Japanese sentence." },
};

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    ...BASE_SCHEMA_PROPERTIES,
    grammarFeedback: { type: Type.STRING, description: "Optional." } 
  },
  required: ["japaneseKanji", "japaneseHiragana", "romaji", "japaneseFurigana", "simplifiedChineseTranslation", "chineseTranslation"]
};

export const generateCardFromInput = async (userInput: string): Promise<GeminiResponse> => {
  if (!apiKey) throw new Error(TEXT.ERRORS.MISSING_API_KEY);

  const userQuery = `
    The user has provided the following Japanese sentence: "${userInput}".
    1. Confirm and format this Japanese sentence.
    2. Provide the Traditional Chinese translation.
    3. **CRITICAL:** For the 'japaneseFurigana' field, you MUST wrap every Kanji character with HTML <ruby> tags to show the reading.
    Example format: <ruby>漢<rt>かん</rt></ruby><ruby>字<rt>じ</rt></ruby>
    Do NOT use parentheses like 漢字(かんじ). YOU MUST USE RUBY TAGS.
  `;

  const systemPrompt = "You are a Japanese language expert. Your output must be valid JSON. Ensure 'japaneseFurigana' contains valid HTML ruby tags for ALL Kanji characters.";

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: userQuery,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  if (!response.text) throw new Error("No data returned from Gemini.");
  return JSON.parse(response.text) as GeminiResponse;
};

export const generateGrammarFeedback = async (originalInput: string, currentKanji: string): Promise<string> => {
  if (!apiKey) throw new Error(TEXT.ERRORS.MISSING_API_KEY);

  const userQuery = `
    The user input was: "${originalInput}".
    The generated Japanese sentence is: "${currentKanji}".
    
    Please provide a short (max 1 sentence) constructive grammarFeedback in **Traditional Chinese**.
    Focus on:
    1. Is the Japanese natural?
    2. Is it appropriate for a tourist context?
    3. Are there any grammatical errors?
    
    If it is perfect, just say "這句日文非常自然且正確。"
  `;

  const feedbackSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      grammarFeedback: { type: Type.STRING, description: "Constructive grammar feedback in Traditional Chinese." }
    },
    required: ["grammarFeedback"]
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: userQuery,
    config: {
      responseMimeType: "application/json",
      responseSchema: feedbackSchema
    }
  });

  if (!response.text) throw new Error("No feedback returned.");
  const parsed = JSON.parse(response.text);
  return parsed.grammarFeedback;
};

export const generateImprovedCardData = async (
  title: string, 
  kanji: string, 
  grammarFeedback: string, 
  originalInput: string
): Promise<GeminiResponse> => {
  if (!apiKey) throw new Error(TEXT.ERRORS.MISSING_API_KEY);

  const userQuery = `
    The previous Japanese sentence summarized as "${title}" was: "${kanji}". 
    The previous AI feedback provided was: "${grammarFeedback}". 
    The original user Japanese input was: "${originalInput}".
    Please generate a **new, more natural and improved Japanese expression** based on this feedback and the original Japanese input. 
    1. Provide the Japanese expression in Kanji, its full Hiragana reading, and the Romaji. 
    2. **CRITICAL:** For 'japaneseFurigana', you MUST use HTML <ruby> tags for ALL Kanji. Example: <ruby>改<rt>かい</rt></ruby><ruby>良<rt>りょう</rt></ruby>
    3. Provide the Traditional Chinese translation for this IMPROVED Japanese expression.
  `;

  const systemPrompt = "You are a Japanese language expert. Output valid JSON. Ensure 'japaneseFurigana' contains valid HTML ruby tags for ALL Kanji.";

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: userQuery,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  if (!response.text) throw new Error("No data returned from Gemini.");
  return JSON.parse(response.text) as GeminiResponse;
};

// --- Text to Speech ---
export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    if (!apiKey) throw new Error(TEXT.ERRORS.MISSING_API_KEY);

    const response = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned from Gemini.");
    
    return base64Audio;
};
