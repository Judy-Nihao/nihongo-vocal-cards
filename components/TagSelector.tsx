import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Tag } from '../types';
import { getRandomColor, generateId } from '../utils/tagUtils';
import { TEXT } from '../utils/common';

interface TagSelectorProps {
  selectedTagIds: string[];
  allTags: Tag[];
  onChange: (newTagIds: string[]) => void;
  onCreateTag: (newTag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
  disabled?: boolean;
}

const TagSelector: React.FC<TagSelectorProps> = ({ 
  selectedTagIds, 
  allTags, 
  onChange, 
  onCreateTag,
  onDeleteTag,
  disabled 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter tags logic
  const filteredTags = useMemo(() => {
    let result = allTags;
    
    // 1. Filter by input search text
    if (inputValue.trim()) {
      result = result.filter(tag => 
        tag.name.toLowerCase().includes(inputValue.toLowerCase())
      );
    }

    // 2. Filter out already selected tags (Requirement: disappear from list)
    result = result.filter(tag => !selectedTagIds.includes(tag.id));

    return result;
  }, [allTags, inputValue, selectedTagIds]);

  // Check if the exact input exists as a tag (to toggle create button)
  const exactMatch = allTags.find(
    tag => tag.name.toLowerCase() === inputValue.trim().toLowerCase()
  );

  // Get selected tag objects for display
  const selectedTags = selectedTagIds
    .map(id => allTags.find(t => t.id === id))
    .filter((t): t is Tag => !!t);

  const handleSelectTag = (tag: Tag) => {
    // Add to selection
    onChange([...selectedTagIds, tag.id]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleCreateTag = () => {
    if (!inputValue.trim()) return;
    
    // Create new tag
    const newTag: Tag = {
      id: generateId(),
      name: inputValue.trim(),
      color: getRandomColor()
    };
    
    onCreateTag(newTag);
    onChange([...selectedTagIds, newTag.id]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const removeTag = (idToRemove: string) => {
    onChange(selectedTagIds.filter(id => id !== idToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (e.nativeEvent.isComposing) return; // Ignore IME composition

        if (inputValue.trim()) {
            if (exactMatch) {
                // If it's an exact match and not selected yet, select it
                if (!selectedTagIds.includes(exactMatch.id)) {
                    handleSelectTag(exactMatch);
                }
            } else {
                handleCreateTag();
            }
        }
    } else if (e.key === 'Backspace' && !inputValue && selectedTagIds.length > 0) {
        removeTag(selectedTagIds[selectedTagIds.length - 1]);
    }
  };

  // Determine if we should show the dropdown
  // Show if: 1. There are filtered existing tags to pick from OR 2. Input is not empty and can create new tag
  const showDropdown = filteredTags.length > 0 || (!!inputValue.trim() && !exactMatch);

  return (
    <div className="relative" ref={containerRef}>
      {/* Input Area */}
      <div 
        className={`bg-white border border-gray-100 rounded-2xl p-2 transition-all flex flex-wrap gap-2 min-h-[50px] items-center cursor-text shadow-sm ${isOpen ? 'ring-2 ring-violet-100 border-violet-200' : 'hover:border-violet-200'}`}
        onClick={() => {
            if (!disabled) {
                setIsOpen(true);
                inputRef.current?.focus();
            }
        }}
      >
        {selectedTags.map(tag => (
            <span 
                key={tag.id} 
                className={`${tag.color.bg} ${tag.color.text} text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 select-none`}
            >
                {tag.name}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        removeTag(tag.id);
                    }} 
                    className="hover:opacity-70 bg-black/5 rounded-full p-0.5"
                >
                    <X size={10} />
                </button>
            </span>
        ))}
        
        <input 
            ref={inputRef}
            type="text"
            className="flex-1 min-w-[60px] text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-transparent h-6 px-1"
            placeholder={selectedTags.length === 0 ? TEXT.PLACEHOLDERS.SELECT_OR_CREATE_TAG : ''}
            value={inputValue}
            onChange={(e) => {
                setInputValue(e.target.value);
                setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-violet-100/50 border border-gray-100 max-h-60 overflow-y-auto z-50 p-2">
            
            <div className="flex flex-col gap-1">
                {/* Filtered Existing Tags */}
                {filteredTags.map(tag => (
                    <div 
                        key={tag.id}
                        className="flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer text-sm transition-colors hover:bg-gray-50 group"
                        onClick={() => handleSelectTag(tag)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${tag.color.bg.replace('bg-', 'bg-current ')} ${tag.color.text}`} />
                            <span className={`${tag.color.text} font-bold`}>
                                {tag.name}
                            </span>
                        </div>
                        
                        {/* Delete button (Trash icon) */}
                        <button
                             onClick={(e) => {
                                 e.stopPropagation();
                                 onDeleteTag(tag.id);
                             }}
                             className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                             title={TEXT.BUTTONS.DELETE_TAG}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {/* Create Option */}
                {inputValue.trim() && !exactMatch && (
                    <div 
                        className="flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer text-sm hover:bg-gray-50 mt-1 text-violet-600"
                        onClick={handleCreateTag}
                    >
                        <Plus size={16} />
                        <span className="font-bold">{TEXT.PLACEHOLDERS.CREATE_TAG_PREFIX} "{inputValue.trim()}"</span>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default TagSelector;