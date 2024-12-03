// src/components/notes/NoteCard.tsx
import React from "react";
import { X } from "lucide-react";
import { Note } from "../../types/Note";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  return (
    <div key={note.id} className="bg-white shadow-md rounded-lg p-4 relative">
      <button
        onClick={() => onDelete(note.id)}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      >
        <X size={20} />
      </button>
      <p className="text-gray-700 mb-2">{note.selectedText}</p>
      {note.text && (
        <p className="text-sm text-gray-500 italic mb-2">{note.text}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
          >
            {tag}
          </span>
        ))}
      </div>
      <small className="text-gray-400 block mt-2">
        {new Date(note.createdAt).toLocaleString()}
      </small>
    </div>
  );
};

export default NoteCard;
