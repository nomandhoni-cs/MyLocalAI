// src/types/Note.ts
export interface Note {
  id: string;
  text: string;
  tags: string[];
  selectedText: string;
  createdAt: number;
}
