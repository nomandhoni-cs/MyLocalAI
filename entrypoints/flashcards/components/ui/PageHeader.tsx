// src/components/ui/PageHeader.tsx
import React from "react";
import { StickyNote, BookOpen } from "lucide-react";

interface PageHeaderProps {
  currentView: "notes" | "flashcards";
}

const PageHeader: React.FC<PageHeaderProps> = ({ currentView }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        {currentView === "notes" ? (
          <>
            <StickyNote /> Notes
          </>
        ) : (
          <>
            <BookOpen /> Flashcards
          </>
        )}
      </h1>
    </div>
  );
};

export default PageHeader;
