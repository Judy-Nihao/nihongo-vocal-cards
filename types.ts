
export interface TagColor {
  name: string;
  bg: string;
  text: string;
}

export interface Tag {
  id: string;
  name: string;
  color: TagColor;
}

// Unified Voice Interface
export interface AppVoice {
  name: string;
  type: 'browser' | 'gemini';
  lang: string; // 'ja-JP'
  originalVoice?: SpeechSynthesisVoice; // for browser type
}

export interface PhraseData {
  id: number;
  japaneseFurigana: string;
  subText: string;
  soundText: string;
}

export interface CardData {
  id: number;
  title: string;
  kanji: string;
  hiragana: string;
  romaji: string;
  soundText?: string;
  isCustom: boolean;
  japaneseFurigana?: string;
  grammarFeedback?: string;
  isImproved?: boolean;
  originalInput?: string;
  chineseTranslation?: string;
  tagIds?: string[]; // References to Tag objects
  isFallback?: boolean; // New flag for offline/error fallback cards
}

export interface GeminiResponse {
  japaneseKanji: string;
  japaneseHiragana: string;
  romaji: string;
  japaneseFurigana: string;
  simplifiedChineseTranslation: string;
  chineseTranslation: string;
  grammarFeedback?: string;
}