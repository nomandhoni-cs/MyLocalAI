import React from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface FlashcardNavigationProps {
  currentFlashcardIndex: number;
  totalFlashcards: number;
  onNext: () => void;
  onPrev: () => void;
}

const FlashcardNavigation: React.FC<FlashcardNavigationProps> = ({
  currentFlashcardIndex,
  totalFlashcards,
  onNext,
  onPrev,
}) => {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-8">
      <button
        onClick={onPrev}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-full transition-colors duration-200 shadow-md"
      >
        <ChevronLeft size={24} />
      </button>
      <div className="text-gray-500 font-medium text-lg">
        {currentFlashcardIndex + 1} / {totalFlashcards}
      </div>
      <button
        onClick={onNext}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-full transition-colors duration-200 shadow-md"
      >
        <ChevronRight size={24} />
      </button>
    </div>
  );
};

export default FlashcardNavigation;
