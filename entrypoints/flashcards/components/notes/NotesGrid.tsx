// src/components/notes/NotesGrid.tsx
import React from "react";
import NoteCard from "./NoteCard";
import { Note } from "../../types/Note";

interface NotesGridProps {
  notes: Note[];
  onDeleteNote: (id: string) => void;
}

const NotesGrid: React.FC<NotesGridProps> = ({ notes, onDeleteNote }) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} onDelete={onDeleteNote} />
      ))}
    </div>
  );
};

export default NotesGrid;
