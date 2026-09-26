import React from 'react';
import { Quote } from '../types';
import { InteractiveCardStudio } from './InteractiveCardStudio';
import { X } from 'lucide-react';
import { audioManager } from '../utils/sound';

interface CardStudioModalProps {
  quote: Quote | null;
  allQuotes: Quote[];
  onClose: () => void;
  theme: 'dark' | 'sepia';
}

export const CardStudioModal: React.FC<CardStudioModalProps> = ({
  quote,
  allQuotes,
  onClose,
  theme,
}) => {
  if (!quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-ink">
      <div
        className={`relative w-full max-w-4xl max-h-[94vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          theme === 'dark'
            ? 'bg-[#16161A] border-[#2E2E3C] text-[#E2D9C8]'
            : 'bg-[#FBF6EE] border-[#DECDB7] text-[#2C241D]'
        }`}
      >
        {/* Floating Close Button */}
        <button
          onClick={() => {
            audioManager.playPaperRustle();
            onClose();
          }}
          className={`absolute top-4 left-4 z-20 p-2 rounded-full border transition-all ${
            theme === 'dark'
              ? 'bg-[#22222B]/90 hover:bg-[#2C2C38] border-[#3E3E50] text-[#FAF6EE]'
              : 'bg-[#FAF4EB]/90 hover:bg-[#EDE2D2] border-[#DECDB7] text-[#2C241D]'
          }`}
          title="إغلاق صانع البطاقات"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7">
          <InteractiveCardStudio
            initialQuote={quote}
            allQuotes={allQuotes}
            theme={theme}
            onCloseModal={onClose}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};
