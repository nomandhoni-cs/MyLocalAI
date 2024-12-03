import React from "react";

interface FlashcardViewProps {
  flashcard: { question: string; answer: string };
  originalNote: { selectedText: string };
  showAnswer: boolean;
  onShowAnswer: () => void;
}

const FlashcardView: React.FC<FlashcardViewProps> = ({
  flashcard,
  originalNote,
  showAnswer,
  onShowAnswer,
}) => {
  return (
    <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-3xl relative overflow-hidden border border-gray-100">
      <div className="absolute top-6 left-6 flex flex-wrap gap-2">
        {originalNote.selectedText && (
          <span className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full">
            {originalNote.selectedText}
          </span>
        )}
      </div>

      <div className="mt-12 mb-16">
        <h2 className="text-3xl font-bold mb-8 text-gray-800">
          Flashcard Question
        </h2>
        <p className="text-gray-700 text-xl mb-10">{flashcard.question}</p>

        {showAnswer ? (
          <>
            <h3 className="text-2xl font-semibold mt-10 mb-6 text-gray-800">
              Answer
            </h3>
            <p className="text-gray-600 text-lg">{flashcard.answer}</p>
            <div className="mt-6">
              <h4 className="text-xl font-semibold text-gray-800">
                Original Context
              </h4>
              <p className="text-gray-500 italic">
                {originalNote.selectedText}
              </p>
            </div>
          </>
        ) : (
          <button
            onClick={onShowAnswer}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg"
          >
            Show Answer
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashcardView;
