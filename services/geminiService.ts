import { GeminiResponse } from "../types";

// API Base URL - in production this will be your Vercel domain
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const generateCardFromInput = async (
  userInput: string,
): Promise<GeminiResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate?service=generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userInput }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${response.status}:${error.error || "Request failed"}`);
  }

  return response.json() as Promise<GeminiResponse>;
};

export const generateGrammarFeedback = async (
  originalInput: string,
  currentKanji: string,
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generate?service=feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalInput, currentKanji }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${response.status}:${error.error || "Request failed"}`);
  }

  const data = await response.json();
  return data.grammarFeedback;
};

export const generateImprovedCardData = async (
  title: string,
  kanji: string,
  grammarFeedback: string,
  originalInput: string,
): Promise<GeminiResponse> => {
  const response = await fetch(`${API_BASE_URL}/generate?service=improve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, kanji, grammarFeedback, originalInput }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${response.status}:${error.error || "Request failed"}`);
  }

  return response.json() as Promise<GeminiResponse>;
};

// --- Text to Speech ---
export const generateSpeech = async (
  text: string,
  voiceName: string,
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/generate?service=speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voiceName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${response.status}:${error.error || "Request failed"}`);
  }

  const data = await response.json();
  return data.audio;
};
