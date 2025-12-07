
import React from 'react';
import { X, Tag as TagIcon } from 'lucide-react';
import TagSelector from './TagSelector';
import { Tag } from '../types';
import { TEXT } from '../utils/common';

interface TagEditModalProps {
  cardId: number;
  initialTagIds: string[];
  allTags: Tag[];
  onUpdate: (cardId: number, newTagIds: string[]) => void;
  onCreateTag: (newTag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
  onClose: () => void;
}

const TagEditModal: React.FC<TagEditModalProps> = ({
  cardId,
  initialTagIds,
  allTags,
  onUpdate,
  onCreateTag,
  onDeleteTag,
  onClose
}) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(initialTagIds);

  const handleChange = (newIds: string[]) => {
    setSelectedIds(newIds);
    // Real-time update (Notion style)
    onUpdate(cardId, newIds);
  };

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-40 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <TagIcon size={18} className="text-indigo-500" />
            {TEXT.MODALS.TAG_EDIT_TITLE}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="mb-2 text-sm text-gray-500 font-medium">
            {TEXT.LABELS.EDIT_TAG_INSTRUCTION}
          </div>
          <div className="relative z-10"> 
             {/* TagSelector needs to be in a relative container with z-index 
                 so its dropdown floats above everything else in the modal */}
            <TagSelector
              allTags={allTags}
              selectedTagIds={selectedIds}
              onChange={handleChange}
              onCreateTag={onCreateTag}
              onDeleteTag={onDeleteTag}
            />
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
                onClick={onClose}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
                {TEXT.BUTTONS.CONFIRM}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagEditModal;
