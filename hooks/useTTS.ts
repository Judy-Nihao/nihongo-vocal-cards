
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppVoice } from '../types';
import { generateSpeech } from '../services/geminiService';
import { TEXT } from '../utils/common';

// Gemini Voices Constants
const GEMINI_VOICES = [
  { name: 'Kore', label: `Kore (${TEXT.VOICE_DESCRIPTIONS.Kore})` },
  { name: 'Fenrir', label: `Fenrir (${TEXT.VOICE_DESCRIPTIONS.Fenrir})` },
  { name: 'Puck', label: `Puck (${TEXT.VOICE_DESCRIPTIONS.Puck})` },
  { name: 'Charon', label: `Charon (${TEXT.VOICE_DESCRIPTIONS.Charon})` },
  { name: 'Zephyr', label: `Zephyr (${TEXT.VOICE_DESCRIPTIONS.Zephyr})` },
];

// Helper to convert Raw PCM to WAV format
// This adds the RIFF header so iOS/Browsers recognize it as a standard audio file
function addWavHeader(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitDepth: number): ArrayBuffer {
    const headerLength = 44;
    const dataLength = pcmData.length;
    const fileSize = headerLength + dataLength;
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // RIFF identifier
    writeString(0, 'RIFF');
    // file length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    writeString(8, 'WAVE');
    // format chunk identifier
    writeString(12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 is PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sampleRate * blockAlign)
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    writeString(36, 'data');
    // data chunk length
    view.setUint32(40, dataLength, true);

    // write the PCM samples
    const bytes = new Uint8Array(buffer);
    bytes.set(pcmData, 44);

    return buffer;
}

export const useTTS = () => {
  const [speaking, setSpeaking] = useState(false);
  const [loadingText, setLoadingText] = useState<string | null>(null); 
  const [voices, setVoices] = useState<AppVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<AppVoice | null>(null);
  
  // Use HTMLAudioElement for better iOS compatibility than AudioContext
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Cache Blob URLs: key -> objectUrl
  const audioCache = useRef<Map<string, string>>(new Map()); 
  
  // Track active API request to allow cancellation
  const activeRequestIdRef = useRef<number | null>(null);

  // --- Voice Loading Logic ---
  const getVoicesSafe = useCallback(() => {
     const allBrowserVoices = window.speechSynthesis.getVoices();
     // Relaxed filter: Allow ANY Japanese voice to support iOS (Kyoko, Otoya, Siri)
     const jaBrowserVoices = allBrowserVoices.filter(v => 
        v.lang.includes('ja') || v.lang.includes('JP')
     );
     return jaBrowserVoices;
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const jaBrowserVoices = getVoicesSafe();
      
      const appBrowserVoices: AppVoice[] = jaBrowserVoices.map(v => ({
        name: `[Device] ${v.name.replace('Google 日本語', 'Google JP').replace('Google Japanese', 'Google JP')}`,
        type: 'browser',
        lang: v.lang,
        originalVoice: v
      }));

      // Define Gemini Voices
      const appGeminiVoices: AppVoice[] = GEMINI_VOICES.map(v => ({
        name: `[AI] ${v.label}`,
        type: 'gemini',
        lang: 'ja-JP',
        originalVoice: undefined 
      }));

      // Combine
      const combinedVoices = [...appGeminiVoices, ...appBrowserVoices];
      setVoices(combinedVoices);

      // Set Default
      if (!selectedVoice && combinedVoices.length > 0) {
         setSelectedVoice(combinedVoices[0]);
      } else if (selectedVoice) {
         // Validate existence
         const exists = combinedVoices.find(v => v.name === selectedVoice.name);
         if (!exists && combinedVoices.length > 0) {
             setSelectedVoice(combinedVoices[0]);
         }
      }
    };

    // Initial load
    loadVoices();

    // Event listener for when voices are loaded asynchronously (Chrome/iOS)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [selectedVoice, getVoicesSafe]);


  // --- Playback Logic ---

  const stopAll = useCallback(() => {
    // Stop Browser TTS
    window.speechSynthesis.cancel();
    
    // Stop Audio Element
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    setSpeaking(false);
  }, []);

  const playBrowserTTS = (text: string, voiceName: string) => {
    stopAll();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    
    // RE-FETCH voices right before speaking to ensure object freshness on iOS
    const currentVoices = getVoicesSafe();
    // Try to match by name
    let targetVoice = currentVoices.find(v => `[Device] ${v.name}`.includes(voiceName) || v.name === voiceName);
    
    // Fallback logic for iOS: if specific voice not found, use first Japanese voice
    if (!targetVoice && currentVoices.length > 0) {
        targetVoice = currentVoices[0];
    }

    if (targetVoice) {
        utterance.voice = targetVoice;
    }
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const playGeminiTTS = async (text: string, voiceNameRaw: string) => {
    stopAll();

    // Generate a unique ID for this request
    const requestId = Date.now();
    activeRequestIdRef.current = requestId;

    try {
        const voiceNameKey = GEMINI_VOICES.find(v => voiceNameRaw.includes(v.name))?.name || 'Kore';
        const cacheKey = `${voiceNameKey}:${text}`;
        
        let audioUrl: string;

        if (audioCache.current.has(cacheKey)) {
            audioUrl = audioCache.current.get(cacheKey)!;
        } else {
            setLoadingText(text);
            const base64Audio = await generateSpeech(text, voiceNameKey);
            
            // Check cancellation
            if (activeRequestIdRef.current !== requestId) return;

            // 1. Decode Base64
            const binaryString = atob(base64Audio);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // 2. Add WAV Header (Critical for file-based playback on iOS)
            const wavBuffer = addWavHeader(bytes, 24000, 1, 16);

            // 3. Create Blob URL
            const blob = new Blob([wavBuffer], { type: 'audio/wav' });
            audioUrl = URL.createObjectURL(blob);

            // Check cancellation before caching
            if (activeRequestIdRef.current !== requestId) return;

            audioCache.current.set(cacheKey, audioUrl);
            setLoadingText(null); 
        }

        // 4. Play using standard HTML Audio Element
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
            setSpeaking(false);
            activeRequestIdRef.current = null;
        };
        
        audio.onerror = (e) => {
            console.error("Audio Playback Error", e);
            setSpeaking(false);
            alert(TEXT.ERRORS.TTS_FAILED);
        };

        setSpeaking(true);
        // iOS requires user interaction to play. 
        // new Audio().play() handles this well when initiated from a click handler.
        await audio.play();

    } catch (error) {
        // Ignore errors if request was cancelled
        if (activeRequestIdRef.current !== requestId) return;

        console.error("Gemini TTS Error:", error);
        setLoadingText(null);
        setSpeaking(false);
        alert(TEXT.ERRORS.TTS_NETWORK_ERROR);
    }
  };

  const cancelAudio = useCallback(() => {
    activeRequestIdRef.current = null;
    setLoadingText(null);
    stopAll();
  }, [stopAll]);

  const playAudio = useCallback(async (text: string) => {
    if (!selectedVoice) return;

    // Stop previous
    cancelAudio();

    if (selectedVoice.type === 'browser') {
        playBrowserTTS(text, selectedVoice.name);
    } else {
        await playGeminiTTS(text, selectedVoice.name);
    }
  }, [selectedVoice, getVoicesSafe]); 

  return {
    speaking,
    loadingText,
    voices,
    selectedVoice,
    setSelectedVoice,
    playAudio,
    cancelAudio 
  };
};
