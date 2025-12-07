
import React, { useState } from 'react';
import { Trash2, Edit2, X, Check, Tag as TagIcon } from 'lucide-react';
import { Tag } from '../types';
import { TEXT } from '../utils/common';

interface TagManagerProps {
  tags: Tag[];
  onUpdateTag: (updatedTag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
  onClose: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ tags, onUpdateTag, onDeleteTag, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
  };

  const saveEdit = (tag: Tag) => {
    if (editName.trim()) {
        onUpdateTag({ ...tag, name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <TagIcon size={18} />
                {TEXT.MODALS.TAG_MANAGER_TITLE}
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
            </button>
        </div>
        
        <div className="overflow-y-auto p-4 flex-1">
            {tags.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                    {TEXT.PLACEHOLDERS.NO_CUSTOM_TAGS}
                </div>
            ) : (
                <div className="space-y-3">
                    {tags.map(tag => (
                        <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg group transition-colors">
                            {editingId === tag.id ? (
                                <div className="flex items-center gap-2 flex-1 mr-2">
                                    <input 
                                        autoFocus
                                        className="flex-1 border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && saveEdit(tag)}
                                    />
                                    <button onClick={() => saveEdit(tag)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                                        <Check size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${tag.color.bg.replace('bg-', 'bg-current ')} ${tag.color.text}`} />
                                    <span className={`${tag.color.bg} ${tag.color.text} px-2 py-0.5 rounded text-sm font-medium`}>
                                        {tag.name}
                                    </span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-6 pl-2">
                                {!editingId && (
                                    <>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                startEdit(tag);
                                            }}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors p-1"
                                            title={TEXT.BUTTONS.RENAME}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteTag(tag.id);
                                            }}
                                            className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                            title={TEXT.BUTTONS.DELETE_TAG}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TagManager;
