
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Loader, AlertTriangle, ArrowRight, Sparkles, ChevronDown, 
  Smartphone, Check, X
} from 'lucide-react';
import VocabCard from './components/VocabCard';
import ConfirmModal from './components/ConfirmModal';
import TagSelector from './components/TagSelector';
import TagManager from './components/TagManager';
import TagEditModal from './components/TagEditModal';
import { useTTS } from './hooks/useTTS';
import { generateCardFromInput, generateImprovedCardData, generateGrammarFeedback } from './services/geminiService';
import { CardData, Tag, AppVoice } from './types';
import { NOTION_COLORS } from './utils/tagUtils';
import { TEXT } from './utils/common';

// Initialize default tags
const DEFAULT_TAG_ID = 'default-tag-1';

const initialTags: Tag[] = [
  { id: DEFAULT_TAG_ID, name: TEXT.LABELS.DEFAULT_TAG, color: NOTION_COLORS[1] }, // Violet
];

// LocalStorage Keys
const STORAGE_KEY_TAGS = 'travel_note_tags_v1';
const STORAGE_KEY_CARDS = 'travel_note_cards_v1';
const STORAGE_KEY_APP_NAME = 'travel_note_app_name_v1';

const App = () => {
  // Logic Hooks
  const { speaking, loadingText, voices, selectedVoice, setSelectedVoice, playAudio, cancelAudio } = useTTS();

  // Data State with Persistence
  const [tags, setTags] = useState<Tag[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TAGS);
      return saved ? JSON.parse(saved) : initialTags;
    } catch (e) {
      console.warn("Failed to load tags from storage:", e);
      return initialTags;
    }
  });

  const [customCards, setCustomCards] = useState<CardData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CARDS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Failed to load cards from storage:", e);
      return [];
    }
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CARDS, JSON.stringify(customCards));
  }, [customCards]);

  // UI State
  const [userInput, setUserInput] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([DEFAULT_TAG_ID]); 
  
  const [isLoading, setIsLoading] = useState(false); // Global loading for new cards
  const [improvingCardId, setImprovingCardId] = useState<number | null>(null); // Specific loading for improvement
  const improvementRequestIdRef = useRef<number | null>(null);

  const [feedbackLoadingId, setFeedbackLoadingId] = useState<number | null>(null);
  const feedbackRequestIdRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<number | null>(null);
  
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  
  // Voice Menu State
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);

  // --- Handlers ---
  const handleVoiceSelect = (voice: AppVoice) => {
    setSelectedVoice(voice);
    setIsVoiceMenuOpen(false);
  };

  // --- Tag Management ---
  const handleCreateTag = (newTag: Tag) => {
    setTags(prev => [...prev, newTag]);
  };

  const handleUpdateTag = (updatedTag: Tag) => {
    setTags(prev => prev.map(t => t.id === updatedTag.id ? updatedTag : t));
  };

  const handleDeleteTag = (tagId: string) => {
    setTags(prev => prev.filter(t => t.id !== tagId));
    setSelectedTagIds(prev => prev.filter(id => id !== tagId));
    setCustomCards(prev => prev.map(card => ({
        ...card,
        tagIds: card.tagIds?.filter(id => id !== tagId)
    })));
  };

  const handleUpdateCardTags = (cardId: number, newTagIds: string[]) => {
    setCustomCards(prev => prev.map(c => 
      c.id === cardId ? { ...c, tagIds: newTagIds } : c
    ));
  };

  // --- Modal Logic ---
  const openConfirmModal = (id: number) => {
    setCardToDelete(id);
    setIsModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsModalOpen(false);
    setCardToDelete(null);
  };

  const confirmDelete = () => {
    if (cardToDelete !== null) {
      setCustomCards(prev => prev.filter(card => card.id !== cardToDelete));
    }
    closeConfirmModal();
  };

  const deleteCardFeedback = (cardId: number) => {
    setCustomCards(prev => 
      prev.map(card => 
        card.id === cardId ? { ...card, grammarFeedback: '' } : card
      )
    );
  };

  const handleGenerateNewCard = async () => {
    if (!userInput.trim()) {
      setError(TEXT.ERRORS.INPUT_REQUIRED);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const data = await generateCardFromInput(userInput.trim());
      
      const finalTagIds = selectedTagIds.length > 0 ? selectedTagIds : [];

      const newCard: CardData = {
        id: Date.now(),
        title: data.simplifiedChineseTranslation || userInput.substring(0, 10) + '...',
        kanji: data.japaneseKanji,
        hiragana: data.japaneseHiragana,
        romaji: data.romaji,
        japaneseFurigana: data.japaneseFurigana,
        grammarFeedback: '', 
        isCustom: true,
        originalInput: userInput.trim(),
        chineseTranslation: data.chineseTranslation,
        tagIds: finalTagIds
      };
      setCustomCards(prev => [newCard, ...prev]);
      
      setUserInput('');
      setSelectedTagIds([DEFAULT_TAG_ID]); 
      
    } catch (e: any) {
      console.error(e);
      let errorMessage = `${TEXT.ERRORS.GENERATE_FAILED_PREFIX} ${e.message}`;
      const isQuotaError = e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError) {
        errorMessage = TEXT.ERRORS.API_QUOTA;
      } else {
        errorMessage = TEXT.ERRORS.CONNECTION_ERROR;
      }
      
      setError(errorMessage);

      const finalTagIds = selectedTagIds.length > 0 ? selectedTagIds : [];
      const fallbackCard: CardData = {
          id: Date.now(),
          title: userInput.trim().substring(0, 10) + (userInput.length > 10 ? '...' : ''),
          kanji: userInput.trim(),
          hiragana: '', 
          romaji: '', 
          japaneseFurigana: '', 
          grammarFeedback: '',
          isCustom: true,
          isFallback: true, 
          originalInput: userInput.trim(),
          chineseTranslation: TEXT.LABELS.NO_TRANSLATION_FALLBACK,
          tagIds: finalTagIds
      };
      
      setCustomCards(prev => [fallbackCard, ...prev]);
      setUserInput('');
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetGrammarFeedback = async (cardId: number, originalInput: string, kanji: string) => {
    // Generate new request ID
    const requestId = Date.now();
    feedbackRequestIdRef.current = requestId;
    setFeedbackLoadingId(cardId);
    setError(null);

    try {
        const feedback = await generateGrammarFeedback(originalInput, kanji);
        
        // Check if this request is still the active one
        if (feedbackRequestIdRef.current !== requestId) return;

        setCustomCards(prev => 
            prev.map(card => 
                card.id === cardId ? { ...card, grammarFeedback: feedback } : card
            )
        );
    } catch (e: any) {
        if (feedbackRequestIdRef.current !== requestId) return;

        console.error("Feedback error", e);
        const isQuotaError = e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED');
        setError(isQuotaError ? TEXT.ERRORS.API_QUOTA_SIMPLE : `${TEXT.ERRORS.FEEDBACK_FAILED_PREFIX} ${e.message}`);
    } finally {
        if (feedbackRequestIdRef.current === requestId) {
            setFeedbackLoadingId(null);
        }
    }
  };

  const handleCancelFeedback = () => {
      feedbackRequestIdRef.current = null;
      setFeedbackLoadingId(null);
  };

  const handleGenerateImprovement = async (oldCard: CardData) => {
    if (!oldCard.grammarFeedback || !oldCard.originalInput) return;
    
    // Set up a new request ID to track race conditions/cancellation
    const requestId = Date.now();
    improvementRequestIdRef.current = requestId;
    setImprovingCardId(oldCard.id);
    setError(null);

    try {
      const data = await generateImprovedCardData(
        oldCard.title, 
        oldCard.kanji, 
        oldCard.grammarFeedback, 
        oldCard.originalInput
      );
      
      // Check if this request is still valid (not cancelled or superseded)
      if (improvementRequestIdRef.current !== requestId) return;

      const cleanTitle = data.simplifiedChineseTranslation.replace(/\[改良版\]\s*/, '').trim();

      const newCard: CardData = {
        id: Date.now(),
        title: cleanTitle,
        kanji: data.japaneseKanji,
        hiragana: data.japaneseHiragana,
        romaji: data.romaji,
        japaneseFurigana: data.japaneseFurigana,
        grammarFeedback: TEXT.ERRORS.AI_FEEDBACK_INTRO,
        isCustom: true,
        isImproved: true,
        originalInput: oldCard.originalInput,
        chineseTranslation: data.chineseTranslation,
        tagIds: oldCard.tagIds,
      };

      setCustomCards(prev => [newCard, ...prev]);
    } catch (e: any) {
      if (improvementRequestIdRef.current !== requestId) return;
      
      console.error(e);
      const isQuotaError = e.message.includes('429') || e.message.includes('RESOURCE_EXHAUSTED');
      setError(isQuotaError ? TEXT.ERRORS.IMPROVE_QUOTA_ERROR : `${TEXT.ERRORS.IMPROVE_FAILED_PREFIX} ${e.message}`);
    } finally {
      if (improvementRequestIdRef.current === requestId) {
        setImprovingCardId(null);
      }
    }
  };

  const handleCancelImprovement = () => {
      improvementRequestIdRef.current = null;
      setImprovingCardId(null);
  };

  const getEditingCard = () => {
    if (!editingCardId) return null;
    return customCards.find(c => c.id === editingCardId);
  };
  
  const editingCard = getEditingCard();

  // Helper to display voice name
  const parseVoiceName = (name: string) => {
      if (name.startsWith('[AI]')) return { type: 'AI', label: name.replace('[AI] ', '') };
      if (name.startsWith('[Device]')) return { type: 'Device', label: name.replace('[Device] ', '') };
      return { type: 'Device', label: name };
  };

  return (
    <div className="min-h-screen bg-[#F3F0FF] font-sans pb-24 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      
      {/* Header */}
      <header className="px-6 pt-10 pb-6 bg-[#F3F0FF] text-gray-800 relative z-10 flex justify-between items-end">
        <div>
           <div className="flex items-center gap-2 mb-1.5">
             <div className="bg-white rounded-full p-1.5 shadow-sm mb-1.5">
                <Sparkles size={14} className="text-violet-600 fill-violet-600" />
             </div>
           </div>
           <div className="text-3xl font-extrabold leading-none">
            <h1 className="text-violet-600 leading-8.5">
             {TEXT.APP_NAME.BIG_1}
             <span className="text-[#1F1E33] block">{TEXT.APP_NAME.BIG_2}</span>
           </h1>
           </div>
        </div>
        
        {/* Voice Selector Trigger */}
        <button 
           onClick={() => setIsVoiceMenuOpen(true)}
           className="flex items-center gap-2 bg-white py-2.5 px-4 rounded-full font-bold text-xs text-gray-700 shadow-sm border border-transparent hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
           <span>{TEXT.BUTTONS.VOICE_SETTING}</span>
           <ChevronDown className={`text-gray-400 transition-transform duration-300 ${isVoiceMenuOpen ? 'rotate-180 text-violet-600' : ''}`} size={16} />
        </button>
      </header>

      <main className="px-5">

        {/* Input Section */}
        <div className="bg-white rounded-[2.5rem] p-7 shadow-[0_20px_40px_rgb(0,0,0,0.04)] mb-8 relative">
            
            <div className="flex justify-between items-center mb-5">
                 <span className="text-base font-bold text-[#1F1E33]">{TEXT.LABELS.NEW_PHRASE}</span>
                 <button 
                    onClick={() => setIsTagManagerOpen(true)}
                    className="text-xs text-gray-400 hover:text-violet-600 flex items-center gap-1 font-bold transition-colors bg-gray-50 px-3 py-1.5 rounded-full"
                 >
                    {TEXT.BUTTONS.MANAGE_TAGS} <ArrowRight size={12} />
                 </button>
            </div>

            <div className="mb-4">
                <TagSelector 
                    allTags={tags}
                    selectedTagIds={selectedTagIds}
                    onChange={setSelectedTagIds}
                    onCreateTag={handleCreateTag}
                    onDeleteTag={handleDeleteTag}
                    disabled={isLoading}
                />
            </div>

            <div className="relative">
                <textarea
                    className="w-full p-5 bg-[#F8F9FA] border-0 rounded-[1.5rem] text-lg text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-violet-200 focus:bg-white transition-all resize-none font-medium leading-relaxed"
                    placeholder={TEXT.PLACEHOLDERS.INPUT_JAPANESE}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    rows={3}
                    disabled={isLoading}
                />
            </div>
            
            {error && (
                <div className="mt-4 bg-red-50 text-red-600 text-xs font-medium rounded-2xl p-4 flex items-start gap-2">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{error}</div>
                </div>
            )}

            <button
                onClick={handleGenerateNewCard}
                className={`mt-5 w-full py-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-200/50 ${isLoading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                    : 'bg-[#1F1E33] text-white hover:bg-black hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                }`}
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader size={18} className="animate-spin" />
                        <span>{TEXT.BUTTONS.GENERATING}</span>
                    </>
                ) : (
                    <>
                        <Plus size={18} />
                        <span>{TEXT.BUTTONS.CREATE_CARD}</span>
                    </>
                )}
            </button>
        </div>

        {/* Custom Cards Feed */}
        {customCards.length > 0 ? (
             <div className="space-y-6 pb-10">
                 <div className="flex items-center gap-3 px-2 mb-4">
                    <span className="text-sm font-bold text-[#1F1E33]">{TEXT.LABELS.MY_PHRASES}</span>
                    <span className="bg-violet-200 text-violet-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{customCards.length}</span>
                 </div>
                 
                {customCards.map(card => (
                    <VocabCard 
                        key={card.id}
                        card={card}
                        allTags={tags}
                        speaking={speaking}
                        loadingText={loadingText}
                        playAudio={playAudio}
                        cancelAudio={cancelAudio}
                        onDelete={(id) => openConfirmModal(id)}
                        onDeleteFeedback={deleteCardFeedback}
                        onGenerateImprovement={handleGenerateImprovement}
                        onCancelImprovement={handleCancelImprovement}
                        isGeneratingImprovement={improvingCardId === card.id}
                        onGetFeedback={handleGetGrammarFeedback}
                        onCancelFeedback={handleCancelFeedback}
                        isGettingFeedback={feedbackLoadingId === card.id}
                        onEditTags={(c) => setEditingCardId(c.id)}
                    />
                ))}
            </div>
        ) : (
             <div className="text-center py-12 opacity-50">
                 <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-sm">
                     <Plus size={32} className="text-violet-200" />
                 </div>
                 <p className="text-base font-bold text-gray-500">{TEXT.LABELS.START_LEARNING}</p>
                 <p className="text-sm text-gray-400 mt-1">{TEXT.LABELS.ADD_FIRST_SENTENCE}</p>
             </div>
        )}

      </main>
      
      {/* Custom Voice Menu Modal */}
      {isVoiceMenuOpen && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-6"
            onClick={() => setIsVoiceMenuOpen(false)}
        >
            <div 
                className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-lg font-extrabold text-[#1F1E33] tracking-tight">{TEXT.LABELS.SELECT_VOICE}</h3>
                    <button 
                        onClick={() => setIsVoiceMenuOpen(false)}
                        className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                
                <div className="overflow-y-auto p-3 space-y-1">
                    {voices.map(voice => {
                        const isSelected = selectedVoice?.name === voice.name;
                        const info = parseVoiceName(voice.name);
                        
                        return (
                            <button
                                key={voice.name}
                                onClick={() => handleVoiceSelect(voice)}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 text-left ${
                                    isSelected 
                                    ? 'bg-violet-50 ring-1 ring-violet-200' 
                                    : 'hover:bg-gray-50 text-gray-600'
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isSelected ? 'bg-violet-200 text-violet-700' : 
                                    info.type === 'AI' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {info.type === 'AI' ? <Sparkles size={18} /> : <Smartphone size={18} />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className={`font-bold text-sm truncate ${isSelected ? 'text-violet-900' : 'text-gray-700'}`}>
                                        {info.label}
                                    </div>
                                    <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                        {info.type === 'AI' ? TEXT.LABELS.AI_VOICE_LABEL : TEXT.LABELS.DEVICE_VOICE_LABEL}
                                    </div>
                                </div>
                                
                                {isSelected && (
                                    <div className="text-violet-600 pr-1">
                                        <Check size={20} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {/* Other Modals */}
      <ConfirmModal 
        isOpen={isModalOpen} 
        onClose={closeConfirmModal} 
        onConfirm={confirmDelete} 
      />

      {isTagManagerOpen && (
          <TagManager 
              tags={tags}
              onUpdateTag={handleUpdateTag}
              onDeleteTag={handleDeleteTag}
              onClose={() => setIsTagManagerOpen(false)}
          />
      )}

      {editingCard && (
        <TagEditModal
            cardId={editingCard.id}
            initialTagIds={editingCard.tagIds || []}
            allTags={tags}
            onUpdate={handleUpdateCardTags}
            onCreateTag={handleCreateTag}
            onDeleteTag={handleDeleteTag}
            onClose={() => setEditingCardId(null)}
        />
      )}
    </div>
  );
};

export default App;
