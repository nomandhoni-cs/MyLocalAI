// src/components/notes/NotesSearch.tsx
import React from "react";
import { Search } from "lucide-react";

interface NotesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const NotesSearch: React.FC<NotesSearchProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="mb-8 flex gap-4">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-14 pr-6 py-2 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
    </div>
  );
};

export default NotesSearch;
