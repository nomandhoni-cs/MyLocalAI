// src/components/flashcards/FlashcardNavigation.tsx
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FlashcardNavigationProps {
  currentIndex: number;
  totalCards: number;
  onPrev: () => void;
  onNext: () => void;
}

const FlashcardNavigation: React.FC<FlashcardNavigationProps> = ({
  currentIndex,
  totalCards,
  onPrev,
  onNext,
}) => {
  return (
    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
      <button
        onClick={onPrev}
        className="bg-gray-200 p-2 rounded-full hover:bg-gray-300"
      >
        <ChevronLeft />
      </button>
      <button
        onClick={onNext}
        className="bg-gray-200 p-2 rounded-full hover:bg-gray-300"
      >
        <ChevronRight />
      </button>
      <div className="absolute bottom-4 right-4 text-gray-500">
        {currentIndex + 1} / {totalCards}
      </div>
    </div>
  );
};

export default FlashcardNavigation;
