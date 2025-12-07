import React from 'react';
import { Volume2, Trash2 } from 'lucide-react';
import { PhraseData } from '../types';

interface PhraseCardProps {
  data: PhraseData;
  playAudio: (text: string) => void;
  onDelete: (id: number) => void;
}

const PhraseCard: React.FC<PhraseCardProps> = ({ data, playAudio, onDelete }) => {
  return (
    <div className="relative bg-white rounded-xl shadow-md mb-6 overflow-hidden border border-orange-100 p-5 group transition-all">
      {/* Delete Button */}
      <button 
          onClick={(e) => { e.stopPropagation(); onDelete(data.id); }}
          className="absolute top-3 right-3 p-1.5 rounded-full text-red-500 transition-all duration-150 
                     hover:bg-red-600 hover:text-white active:opacity-70 z-20"
          title="刪除卡片"
      >
          <Trash2 size={18} />
      </button>

      <div className="flex flex-col gap-3">
        {/* Japanese with Furigana */}
        <div 
          className="text-xl font-bold text-gray-800 leading-relaxed furigana-container pr-8"
          dangerouslySetInnerHTML={{ __html: data.japaneseFurigana }}
        />
        
        {/* Chinese Subtext */}
        <div className="text-sm text-gray-500">
          {data.subText}
        </div>

        {/* Audio Button - Icon Only */}
        <button 
          onClick={() => playAudio(data.soundText)}
          className="mt-2 w-full py-3 bg-orange-100 text-orange-700 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-orange-200 transition-colors"
          title="播放語音"
        >
          <Volume2 size={24} />
        </button>
      </div>
    </div>
  );
};

export default PhraseCard;