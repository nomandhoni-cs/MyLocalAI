import React from "react";
import { Search, X } from "lucide-react";
import TagFilter from "./TagFilter";
import NotesSearch from "./NotesSearch";

interface Note {
  id: string;
  tags: string[];
  selectedText: string;
  text: string;
  createdAt: number;
}

interface NotesViewProps {
  filteredNotes: Note[];
  toggleTag: (tag: string) => void;
  selectedTags: string[];
  allTags: string[];
  deleteNote: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({
  filteredNotes,
  deleteNote,
  toggleTag,
  selectedTags,
  allTags,
  searchTerm,
  setSearchTerm,
}) => (
  <>
    <NotesSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
    <TagFilter
      onTagToggle={toggleTag}
      selectedTags={selectedTags}
      tags={allTags}
      key={selectedTags.join()}
    />
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredNotes.map((note) => (
        <div
          key={note.id}
          className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100"
        >
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-800 font-medium mb-4 text-lg">
              {note.selectedText}
            </p>
            {note.text && (
              <p className="text-sm text-gray-600 italic mb-6">{note.text}</p>
            )}
            <div className="text-xs text-gray-400">
              {new Date(note.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  </>
);

export default NotesView;
