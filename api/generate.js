import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GOOGLE_AI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = "gemini-2.5-flash";
const TTS_MODEL_NAME = "gemini-2.5-flash-preview-tts";

// Shared Schema parts
const BASE_SCHEMA_PROPERTIES = {
  japaneseKanji: {
    type: Type.STRING,
    description:
      "The complete, natural Japanese sentence in Kanji and Kana (plain text).",
  },
  japaneseHiragana: {
    type: Type.STRING,
    description: "The Japanese sentence purely in Hiragana for TTS playback.",
  },
  romaji: {
    type: Type.STRING,
    description: "The Romanized version of the Japanese sentence.",
  },
  japaneseFurigana: {
    type: Type.STRING,
    description:
      "The Japanese sentence formatted with HTML <ruby> and <rt> tags for furigana (Kanji only).",
  },
  simplifiedChineseTranslation: {
    type: Type.STRING,
    description: "A short summary (max 10 characters) of the sentence.",
  },
  chineseTranslation: {
    type: Type.STRING,
    description:
      "The Traditional Chinese translation of the Japanese sentence.",
  },
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    ...BASE_SCHEMA_PROPERTIES,
    grammarFeedback: { type: Type.STRING, description: "Optional." },
  },
  required: [
    "japaneseKanji",
    "japaneseHiragana",
    "romaji",
    "japaneseFurigana",
    "simplifiedChineseTranslation",
    "chineseTranslation",
  ],
};

// API: Generate card from user input
async function handleGenerateCard(req, res) {
  try {
    const { userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: "userInput is required" });
    }

    const userQuery = `
      The user has provided the following Japanese sentence: "${userInput}".
      1. Confirm and format this Japanese sentence.
      2. Provide the Traditional Chinese translation.
      3. **CRITICAL:** For the 'japaneseFurigana' field, you MUST wrap every Kanji character with HTML <ruby> tags to show the reading.
      Example format: <ruby>漢<rt>かん</rt></ruby><ruby>字<rt>じ</rt></ruby>
      Do NOT use parentheses like 漢字(かんじ). YOU MUST USE RUBY TAGS.
    `;

    const systemPrompt =
      "You are a Japanese language expert. Your output must be valid JSON. Ensure 'japaneseFurigana' contains valid HTML ruby tags for ALL Kanji characters.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: "No data returned from Gemini." });
    }

    return res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    console.error("Generate card error:", error);
    return res.status(500).json({ error: "Failed to generate card" });
  }
}

// API: Generate grammar feedback
async function handleGrammarFeedback(req, res) {
  try {
    const { originalInput, currentKanji } = req.body;

    if (!originalInput || !currentKanji) {
      return res
        .status(400)
        .json({ error: "originalInput and currentKanji are required" });
    }

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

    const feedbackSchema = {
      type: Type.OBJECT,
      properties: {
        grammarFeedback: {
          type: Type.STRING,
          description: "Constructive grammar feedback in Traditional Chinese.",
        },
      },
      required: ["grammarFeedback"],
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userQuery,
      config: {
        responseMimeType: "application/json",
        responseSchema: feedbackSchema,
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: "No feedback returned." });
    }

    const parsed = JSON.parse(response.text);
    return res.status(200).json({ grammarFeedback: parsed.grammarFeedback });
  } catch (error) {
    console.error("Grammar feedback error:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate grammar feedback" });
  }
}

// API: Generate improved card data
async function handleImproveCard(req, res) {
  try {
    const { title, kanji, grammarFeedback, originalInput } = req.body;

    if (!title || !kanji || !grammarFeedback || !originalInput) {
      return res.status(400).json({
        error: "title, kanji, grammarFeedback, and originalInput are required",
      });
    }

    const userQuery = `
      The previous Japanese sentence summarized as "${title}" was: "${kanji}". 
      The previous AI feedback provided was: "${grammarFeedback}". 
      The original user Japanese input was: "${originalInput}".
      Please generate a **new, more natural and improved Japanese expression** based on this feedback and the original Japanese input. 
      1. Provide the Japanese expression in Kanji, its full Hiragana reading, and the Romaji. 
      2. **CRITICAL:** For 'japaneseFurigana', you MUST use HTML <ruby> tags for ALL Kanji. Example: <ruby>改<rt>かい</rt></ruby><ruby>良<rt>りょう</rt></ruby>
      3. Provide the Traditional Chinese translation for this IMPROVED Japanese expression.
    `;

    const systemPrompt =
      "You are a Japanese language expert. Output valid JSON. Ensure 'japaneseFurigana' contains valid HTML ruby tags for ALL Kanji.";

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userQuery,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    if (!response.text) {
      return res.status(500).json({ error: "No data returned from Gemini." });
    }

    return res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    console.error("Improve card error:", error);
    return res.status(500).json({ error: "Failed to improve card" });
  }
}

// API: Generate speech (TTS)
async function handleGenerateSpeech(req, res) {
  try {
    const { text, voiceName } = req.body;

    if (!text || !voiceName) {
      return res.status(400).json({ error: "text and voiceName are required" });
    }

    const response = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["audio"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res
        .status(500)
        .json({ error: "No audio data returned from Gemini." });
    }

    return res.status(200).json({ audio: base64Audio });
  } catch (error) {
    console.error("Generate speech error:", error);
    return res.status(500).json({ error: "Failed to generate speech" });
  }
}

// Main handler with routing
export default async function handler(req, res) {
  // Verify API key
  if (!apiKey) {
    return res.status(500).json({ error: "API Key is not set" });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Route based on URL path or query parameter
  const { service } = req.query;

  switch (service) {
    case "generate":
      return handleGenerateCard(req, res);
    case "feedback":
      return handleGrammarFeedback(req, res);
    case "improve":
      return handleImproveCard(req, res);
    case "speech":
      return handleGenerateSpeech(req, res);
    default:
      // Default to generate for backward compatibility
      return handleGenerateCard(req, res);
  }
}
