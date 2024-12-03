// src/components/flashcards/FlashcardView.tsx
import React, { useState } from "react";
import FlashcardNavigation from "./FlashcardNavigation";
import { Note } from "../../types/Note";

interface FlashcardViewProps {
  flashcards: Note[];
}

const FlashcardView: React.FC<FlashcardViewProps> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (flashcards.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No flashcards available. Add some notes with text!
      </div>
    );
  }

  const currentNote = flashcards[currentIndex];

  const nextFlashcard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    setShowAnswer(false);
  };

  const prevFlashcard = () => {
    setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
    setShowAnswer(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-xl text-center relative">
        <div className="absolute top-4 left-4 flex gap-2">
          {currentNote.tags.map((tag) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Selected Text</h2>
          <p className="text-gray-700 mb-4">{currentNote.selectedText}</p>

          {showAnswer ? (
            <>
              <h3 className="text-lg font-semibold mt-4">Notes</h3>
              <p className="text-gray-600">
                {currentNote.text || "No additional notes"}
              </p>
            </>
          ) : (
            <button
              onClick={() => setShowAnswer(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Show Answer
            </button>
          )}
        </div>

        <FlashcardNavigation
          currentIndex={currentIndex}
          totalCards={flashcards.length}
          onPrev={prevFlashcard}
          onNext={nextFlashcard}
        />
      </div>
    </div>
  );
};

export default FlashcardView;
