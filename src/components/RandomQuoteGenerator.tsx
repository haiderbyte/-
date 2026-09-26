import React, { useState } from 'react';
import { Quote } from '../types';
import { Sparkles, Dices, RefreshCw } from 'lucide-react';
import { audioManager } from '../utils/sound';
import { QuoteCard } from './QuoteCard';

interface RandomQuoteGeneratorProps {
  quotes: Quote[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenCardStudio: (quote: Quote) => void;
  theme: 'dark' | 'sepia';
}

export const RandomQuoteGenerator: React.FC<RandomQuoteGeneratorProps> = ({
  quotes,
  favorites,
  onToggleFavorite,
  onOpenCardStudio,
  theme,
}) => {
  const [currentQuote, setCurrentQuote] = useState<Quote>(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex] || quotes[0];
  });
  const [isSpinning, setIsSpinning] = useState(false);

  const handleNextRandom = () => {
    audioManager.playInkDrop();
    setIsSpinning(true);

    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * quotes.length);
      // Ensure it is not the same quote
      if (quotes.length > 1 && quotes[nextIndex]?.id === currentQuote.id) {
        nextIndex = (nextIndex + 1) % quotes.length;
      }
      setCurrentQuote(quotes[nextIndex] || currentQuote);
      setIsSpinning(false);
    }, 250);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dices className="w-4 h-4 text-[#C46868]" />
          <h3 className="font-amiri text-lg font-bold">شذرة اللحظة العشوائية</h3>
        </div>

        <button
          onClick={handleNextRandom}
          disabled={isSpinning}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-amiri font-bold transition-all ${
            theme === 'dark'
              ? 'bg-[#222227] hover:bg-[#2C2C33] border-[#363640] text-[#E2D9C8]'
              : 'bg-[#EFE5D5] hover:bg-[#E5D9C7] border-[#D8C9B5] text-[#3D3126]'
          }`}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#C46868] ${isSpinning ? 'animate-spin' : ''}`}
          />
          <span>شذرة أخرى</span>
        </button>
      </div>

      <div className={isSpinning ? 'opacity-40 scale-[0.99] transition-all' : 'animate-ink'}>
        <QuoteCard
          quote={currentQuote}
          isFavorite={favorites.includes(currentQuote.id)}
          onToggleFavorite={onToggleFavorite}
          onOpenCardStudio={onOpenCardStudio}
          theme={theme}
        />
      </div>
    </div>
  );
};
