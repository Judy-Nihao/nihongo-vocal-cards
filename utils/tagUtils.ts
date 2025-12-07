
import { Tag, TagColor } from '../types';

// Design-inspired vibrant pastel palette
export const NOTION_COLORS: TagColor[] = [
  { name: 'default', bg: 'bg-gray-100', text: 'text-gray-600' },
  { name: 'violet', bg: 'bg-[#E0D9FF]', text: 'text-[#6D28D9]' }, // More vivid violet
  { name: 'blue', bg: 'bg-[#D1E9FF]', text: 'text-[#0070F3]' },
  { name: 'sky', bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]' },
  { name: 'emerald', bg: 'bg-[#D1FAE5]', text: 'text-[#059669]' },
  { name: 'rose', bg: 'bg-[#FFE4E6]', text: 'text-[#E11D48]' },
  { name: 'amber', bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  { name: 'fuchsia', bg: 'bg-[#FCE7F3]', text: 'text-[#DB2777]' },
  { name: 'orange', bg: 'bg-[#FFEDD5]', text: 'text-[#EA580C]' },
  { name: 'teal', bg: 'bg-[#CCFBF1]', text: 'text-[#0D9488]' },
];

export const getRandomColor = (): TagColor => {
  // Skip the first default gray
  const colorfulOptions = NOTION_COLORS.slice(1); 
  return colorfulOptions[Math.floor(Math.random() * colorfulOptions.length)];
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};