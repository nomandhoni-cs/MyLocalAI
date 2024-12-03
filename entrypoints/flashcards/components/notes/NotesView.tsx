import React from "react";
import { X } from "lucide-react";

interface Note {
  id: string;
  tags: string[];
  selectedText: string;
  text: string;
  createdAt: number;
}

interface NotesViewProps {
  filteredNotes: Note[];
  deleteNote: (id: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({ filteredNotes, deleteNote }) => (
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
);

export default NotesView;
