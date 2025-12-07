
import React from 'react';
import { Trash2 } from 'lucide-react';
import { TEXT } from '../utils/common';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 opacity-100"
        onClick={e => e.stopPropagation()} 
      >
        <div className="flex items-center text-red-600 mb-6 justify-center">
          <Trash2 size={24} className="mr-2" />
          <h3 className="text-xl font-bold">{TEXT.MODALS.DELETE_CONFIRM_TITLE}</h3>
        </div>
        <div className="flex justify-between space-x-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {TEXT.BUTTONS.CANCEL}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
          >
            {TEXT.BUTTONS.DELETE}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
