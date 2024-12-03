// src/components/notes/NotesSearch.tsx
import React from "react";
import { Search, Filter } from "lucide-react";

interface NotesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const NotesSearch: React.FC<NotesSearchProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="mb-6 flex gap-4">
      <div className="relative flex-grow">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={20}
        />
      </div>
      <div className="relative">
        <button className="bg-gray-200 p-2 rounded-lg hover:bg-gray-300">
          <Filter />
        </button>
      </div>
    </div>
  );
};

export default NotesSearch;
