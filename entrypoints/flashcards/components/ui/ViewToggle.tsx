// src/components/ui/ViewToggle.tsx
import React from "react";
import { BookOpen, StickyNote } from "lucide-react";

interface ViewToggleProps {
  currentView: "notes" | "flashcards";
  onToggle: () => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
    >
      {currentView === "notes" ? "Flashcards" : "Notes"}
      {currentView === "notes" ? (
        <BookOpen size={20} />
      ) : (
        <StickyNote size={20} />
      )}
    </button>
  );
};

export default ViewToggle;
