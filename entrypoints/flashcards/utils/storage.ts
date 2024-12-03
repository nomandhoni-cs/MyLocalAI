// src/utils/storage.ts
import { storage } from "wxt/storage";
import { Note } from "../types/Note";

export const notesStorage = {
  async getNotes(): Promise<Note[]> {
    return (await storage.getItem<Note[]>("local:notes")) || [];
  },

  async saveNotes(notes: Note[]): Promise<void> {
    await storage.setItem("local:notes", notes);
  },

  async addNote(note: Note): Promise<void> {
    const existingNotes = await this.getNotes();
    await this.saveNotes([...existingNotes, note]);
  },

  async deleteNote(noteId: string): Promise<void> {
    const existingNotes = await this.getNotes();
    const updatedNotes = existingNotes.filter((note) => note.id !== noteId);
    await this.saveNotes(updatedNotes);
  },
};
