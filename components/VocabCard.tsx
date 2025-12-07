
import React, { useState, useEffect } from 'react';
import { Volume2, Trash2, MessageSquare, Loader, Sparkles, Edit2, Square, VolumeX, Ban, Check, Copy as CopyIcon } from 'lucide-react';
import { CardData, Tag } from '../types';
import { TEXT } from '../utils/common';

interface VocabCardProps {
  card: CardData;
  allTags: Tag[]; 
  speaking: boolean;
  loadingText: string | null; 
  playAudio: (text: string) => void;
  cancelAudio: () => void;
  onDelete: (id: number) => void; 
  onDeleteFeedback: (id: number) => void;
  onGenerateImprovement: (card: CardData) => void;
  onCancelImprovement: () => void;
  isGeneratingImprovement: boolean;
  onGetFeedback: (id: number, originalInput: string, kanji: string) => void;
  onCancelFeedback: () => void;
  isGettingFeedback: boolean;
  onEditTags: (card: CardData) => void; 
}

const VocabCard: React.FC<VocabCardProps> = ({ 
  card, 
  allTags,
  speaking, 
  loadingText,
  playAudio,
  cancelAudio,
  onDelete, 
  onDeleteFeedback, 
  onGenerateImprovement,
  onCancelImprovement,
  isGeneratingImprovement,
  onGetFeedback,
  onCancelFeedback,
  isGettingFeedback,
  onEditTags
}) => {
  const { 
    id, kanji, hiragana, romaji, soundText, 
    grammarFeedback, japaneseFurigana, 
    chineseTranslation, originalInput,
    tagIds, isFallback
  } = card;

  // Resolve Tag Objects
  const displayTags = tagIds 
    ? tagIds.map(tid => allTags.find(t => t.id === tid)).filter((t): t is Tag => !!t)
    : [];
    
  // Use hiragana for accurate TTS matching
  const isAudioLoading = hiragana && loadingText === hiragana; 
  const [allowCancelHover, setAllowCancelHover] = useState(false);
  const [allowImprovementCancelHover, setAllowImprovementCancelHover] = useState(false);
  const [allowFeedbackCancelHover, setAllowFeedbackCancelHover] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Reset allowCancelHover whenever loading starts
  useEffect(() => {
    if (isAudioLoading) {
        setAllowCancelHover(false);
    }
  }, [isAudioLoading]);

  // Reset allowImprovementCancelHover whenever improvement loading starts
  useEffect(() => {
    if (isGeneratingImprovement) {
        setAllowImprovementCancelHover(false);
    }
  }, [isGeneratingImprovement]);

  // Reset allowFeedbackCancelHover whenever feedback loading starts
  useEffect(() => {
    if (isGettingFeedback) {
        setAllowFeedbackCancelHover(false);
    }
  }, [isGettingFeedback]);

  // Copy Logic
  const handleCopy = async () => {
      try {
          await navigator.clipboard.writeText(kanji);
          
          // Haptic feedback for mobile
          if (navigator.vibrate) navigator.vibrate(50);
          
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
          console.error('Failed to copy text', err);
      }
  };

  // Helper to stop propagation for inner buttons
  const stopProp = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
  };

  // Common Tag Render Logic
  const renderTagSection = () => {
    return (
        <div className="flex flex-wrap gap-2 justify-start items-center">
            {displayTags.length > 0 ? (
                displayTags.map(tag => (
                    <span key={tag.id} className={`${tag.color.bg} ${tag.color.text} text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wide`}>
                        {tag.name}
                    </span>
                ))
            ) : (
                <span className="text-[10px] bg-gray-100 text-gray-400 font-bold px-3 py-1.5 rounded-full">
                    未分類
                </span>
            )}
            
            <button 
                onClick={(e) => { stopProp(e); onEditTags(card); }}
                className="text-gray-300 hover:text-violet-500 transition-colors p-1 rounded-full hover:bg-violet-50"
                title={TEXT.BUTTONS.EDIT_TAGS}
            >
                <Edit2 size={12} />
            </button>
        </div>
    );
  };

  const isAudioDisabled = isFallback || !hiragana;

  return (
    <div 
        className={`relative rounded-[2rem] mb-6 overflow-hidden transition-all duration-300 p-7 flex flex-col gap-4 group
        ${isFallback ? 'bg-gray-50 border border-gray-100' : 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]'}
        `}
    >
        {/* Header Row: Tags (Left) vs Delete (Right) */}
        <div className="flex justify-between items-start relative">
            {/* Tags */}
            <div className="pr-8">
                {renderTagSection()}
            </div>

            {/* Delete Button */}
            <button 
                onClick={(e) => { stopProp(e); onDelete(id); }}
                className="relative z-20 p-2 -mt-2 -mr-2 rounded-full text-gray-300 transition-all duration-150 
                            hover:bg-red-50 hover:text-red-500 active:opacity-70 flex-shrink-0"
                title={TEXT.BUTTONS.DELETE}
            >
                <Trash2 size={16} />
            </button>
        </div>

      {/* Main Content Row */}
      <div className="flex flex-col gap-5 mt-2">
          
          <div className="flex items-start gap-4">
             {/* Japanese Text Area */}
             <div className="flex-1 min-w-0">
                {japaneseFurigana ? (
                    <div 
                        className="text-[1.75rem] font-bold text-[#2D2B4A] leading-relaxed furigana-container tracking-wide leading-[2.25]"
                        dangerouslySetInnerHTML={{ __html: japaneseFurigana }}
                    />
                ) : (
                    <div className="text-[1.75rem] font-bold text-[#2D2B4A] leading-relaxed tracking-wide">{kanji}</div>
                )}
                
                {/* Meta Info (Romaji & Translation) */}
                <div className="mt-4 space-y-1.5 pl-0.5">
                    {romaji && <div className="text-xs font-medium text-gray-400 font-sans tracking-normal">{romaji}</div>}
                    <div className="text-base font-medium text-gray-500">
                        {chineseTranslation || TEXT.LABELS.NO_TRANSLATION}
                    </div>
                </div>
             </div>
          </div>
          
          {/* Action Row */}
          <div className="flex items-center gap-3 mt-2">
               {/* Audio Button */}
              <button 
                onClick={(e) => {
                    stopProp(e);
                    if (isAudioDisabled) return;
                    isAudioLoading ? cancelAudio() : playAudio(hiragana);
                }}
                onMouseLeave={() => {
                    if (isAudioLoading) setAllowCancelHover(true);
                }}
                disabled={isAudioDisabled}
                className={`relative z-20 flex-1 h-14 font-bold rounded-full flex items-center justify-center gap-2 transition-all overflow-hidden group/btn shadow-sm ${
                    isAudioDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isAudioLoading 
                        ? (allowCancelHover 
                            ? 'bg-red-50 text-red-500 cursor-pointer' 
                            : 'bg-violet-50 text-violet-500 cursor-default')
                        : 'bg-[#1F1E33] text-white hover:bg-black active:scale-[0.98]'
                }`}
              >
                {isAudioDisabled ? (
                    <VolumeX size={20} />
                ) : isAudioLoading ? (
                    <>
                        <div className={`flex items-center gap-2 transition-transform duration-200 absolute ${allowCancelHover ? 'group-hover/btn:-translate-y-10' : ''}`}>
                            <Loader size={18} className="animate-spin" />
                            <span className="text-sm">{TEXT.LABELS.LOADING}</span>
                        </div>
                        <div className={`flex items-center gap-2 transition-transform duration-200 translate-y-10 absolute text-red-500 font-bold ${allowCancelHover ? 'group-hover/btn:translate-y-0' : ''}`}>
                            <Square size={14} fill="currentColor" />
                            <span className="text-sm">{TEXT.BUTTONS.CANCEL}</span>
                        </div>
                        {/* Fallback for touch devices not triggering hover/btn group properly */}
                         <div className="opacity-0 lg:hidden flex items-center gap-2">
                             <Loader size={18} />
                             <span className="text-sm">{TEXT.LABELS.LOADING}</span>
                        </div>
                    </>
                ) : (
                    <>
                        <Volume2 size={20} className={speaking ? "animate-pulse" : ""} />
                        <span className="text-sm">{TEXT.BUTTONS.PLAY}</span>
                    </>
                )}
              </button>

               {/* Copy Button */}
               <button 
                    onClick={(e) => { stopProp(e); handleCopy(); }}
                    className={`h-14 w-14 rounded-full transition-all duration-200 flex items-center justify-center flex-shrink-0 border ${
                        isCopied 
                        ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                        : 'text-gray-400 bg-white border-gray-100 hover:text-violet-600 hover:border-violet-100 hover:bg-violet-50'
                    }`}
                    title={TEXT.BUTTONS.COPY}
                >
                    {isCopied ? <Check size={20} /> : <CopyIcon size={20} />}
                </button>
          </div>
      </div>
      
      {/* Grammar Feedback Section */}
      {grammarFeedback ? (
        <div className="mt-5 p-5 bg-[#FFFCF5] rounded-3xl border border-amber-100/50 flex flex-col gap-3 relative z-20">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                    <MessageSquare size={12} className="fill-amber-600" />
                    {TEXT.LABELS.AI_SUGGESTION}
                </div>
                <button
                    onClick={(e) => { stopProp(e); onDeleteFeedback(id); }}
                    className="p-1.5 -mr-1.5 -mt-1.5 rounded-full text-amber-300 hover:bg-amber-100 hover:text-amber-700 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <p className="text-sm text-amber-900 font-medium leading-relaxed">
                {grammarFeedback}
            </p>

            <button
                onClick={(e) => { 
                    stopProp(e); 
                    if (isGeneratingImprovement) {
                        onCancelImprovement();
                    } else {
                        onGenerateImprovement(card); 
                    }
                }}
                onMouseLeave={() => {
                    if (isGeneratingImprovement) setAllowImprovementCancelHover(true);
                }}
                className={`relative w-full py-3 text-xs font-bold rounded-full border transition-all flex items-center justify-center gap-1.5 shadow-sm mt-1 overflow-hidden group/imp-btn ${
                    isGeneratingImprovement
                        ? `bg-amber-50 text-amber-600 border-amber-100 ${
                            allowImprovementCancelHover 
                            ? 'hover:bg-red-50 hover:text-red-500 hover:border-red-100 cursor-pointer' 
                            : 'cursor-default'
                          }`
                        : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50 disabled:opacity-50'
                }`}
                disabled={isFallback}
            >
                {isGeneratingImprovement ? (
                     <>
                        <div className={`flex items-center gap-2 transition-transform duration-200 absolute ${allowImprovementCancelHover ? 'group-hover/imp-btn:-translate-y-10' : ''}`}>
                            <Loader size={14} className="animate-spin" />
                            {TEXT.LABELS.AI_FIXING}
                        </div>
                        <div className={`flex items-center gap-2 transition-transform duration-200 translate-y-10 absolute text-red-500 font-bold ${allowImprovementCancelHover ? 'group-hover/imp-btn:translate-y-0' : ''}`}>
                             <Square size={12} fill="currentColor" />
                             <span className="text-xs">{TEXT.BUTTONS.CANCEL}</span>
                        </div>
                        {/* Placeholder to keep height matched with content */}
                        <div className="opacity-0 flex items-center gap-2 pointer-events-none">
                            <Loader size={14} />
                            {TEXT.LABELS.AI_FIXING}
                        </div>
                     </>
                ) : (
                    <>
                        <Sparkles size={14} className="fill-amber-700" />
                        {TEXT.LABELS.GENERATE_IMPROVED}
                    </>
                )}
            </button>
        </div>
      ) : (
          <div className="mt-2 pt-2 relative z-20">
              <button
                  onClick={(e) => { 
                      stopProp(e);
                      if (isGettingFeedback) {
                          onCancelFeedback();
                      } else if (originalInput) {
                          onGetFeedback(id, originalInput, kanji);
                      }
                  }}
                  onMouseLeave={() => {
                      if (isGettingFeedback) setAllowFeedbackCancelHover(true);
                  }}
                  className={`relative w-full py-3 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-1.5 overflow-hidden group/feedback-btn ${
                      isFallback 
                      ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                      : isGettingFeedback
                        ? `bg-gray-50 text-gray-500 ${allowFeedbackCancelHover ? 'hover:bg-red-50 hover:text-red-500 cursor-pointer' : 'cursor-default'}`
                        : 'text-gray-400 hover:bg-white hover:shadow-sm hover:text-violet-600'
                  }`}
                  disabled={isFallback}
              >
                  {isGettingFeedback ? (
                      <>
                          {/* Loading View */}
                          <div className={`flex items-center gap-2 transition-transform duration-200 absolute ${allowFeedbackCancelHover ? 'group-hover/feedback-btn:-translate-y-10' : ''}`}>
                               <Loader size={14} className="animate-spin" />
                               {TEXT.LABELS.AI_CHECKING}
                          </div>
                          {/* Cancel View */}
                          <div className={`flex items-center gap-2 transition-transform duration-200 translate-y-10 absolute text-red-500 font-bold ${allowFeedbackCancelHover ? 'group-hover/feedback-btn:translate-y-0' : ''}`}>
                               <Square size={12} fill="currentColor" />
                               <span className="text-xs">{TEXT.BUTTONS.CANCEL}</span>
                          </div>
                          {/* Placeholder */}
                          <div className="opacity-0 flex items-center gap-2 pointer-events-none">
                                <Loader size={14} />
                                {TEXT.LABELS.AI_CHECKING}
                          </div>
                      </>
                  ) : isFallback ? (
                      <>
                          <Ban size={14} />
                          {TEXT.LABELS.NO_CONNECTION}
                      </>
                  ) : (
                      <>
                          <Sparkles size={14} />
                          {TEXT.LABELS.AI_CHECK}
                      </>
                  )}
              </button>
          </div>
      )}
    </div>
  );
};

export default VocabCard;
