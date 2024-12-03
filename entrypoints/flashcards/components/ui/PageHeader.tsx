import React from "react";
import { StickyNote, BookOpen } from "lucide-react";

interface ViewSwitcherProps {
  currentView: "notes" | "flashcards";
  setCurrentView: React.Dispatch<React.SetStateAction<"notes" | "flashcards">>;
}

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  setCurrentView,
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 md:mb-0 flex items-center">
        {currentView === "notes" ? (
          <>
            <StickyNote className="mr-4 text-yellow-500" size={24} /> Notes
          </>
        ) : (
          <>
            <BookOpen className="mr-4 text-blue-500" size={24} /> Flashcards
          </>
        )}
      </h1>
      <div className="flex items-center gap-4">
        <button
          onClick={() =>
            setCurrentView((prev) =>
              prev === "notes" ? "flashcards" : "notes"
            )
          }
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg text-lg font-semibold"
        >
          {currentView === "notes"
            ? "Switch to Flashcards Mode"
            : "Switch to Notes"}
          {currentView === "notes" ? (
            <BookOpen size={24} />
          ) : (
            <StickyNote size={24} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ViewSwitcher;
