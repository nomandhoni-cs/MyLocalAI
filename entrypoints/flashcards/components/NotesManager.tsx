import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Tag,
  Filter,
  X,
  BookOpen,
  StickyNote,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { storage } from "wxt/storage";

interface Note {
  id: string;
  text: string;
  tags: string[];
  selectedText: string;
  createdAt: number;
}

const NotesManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<"notes" | "flashcards">(
    "notes"
  );
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      const storedNotes = (await storage.getItem<Note[]>("local:notes")) || [];
      setNotes(storedNotes);
    };
    fetchNotes();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch =
        note.selectedText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((selectedTag) => note.tags.includes(selectedTag));

      return matchesSearch && matchesTags;
    });
  }, [notes, searchTerm, selectedTags]);

  const flashcardNotes = useMemo(
    () => filteredNotes.filter((note) => note.selectedText.trim().length > 0),
    [filteredNotes]
  );

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const nextFlashcard = () => {
    setCurrentFlashcardIndex((prev) => (prev + 1) % flashcardNotes.length);
    setShowFlashcardAnswer(false);
  };

  const prevFlashcard = () => {
    setCurrentFlashcardIndex((prev) =>
      prev === 0 ? flashcardNotes.length - 1 : prev - 1
    );
    setShowFlashcardAnswer(false);
  };

  const deleteNote = async (noteId: string) => {
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);
    await storage.setItem("local:notes", updatedNotes);
  };

  const renderNotesView = () => (
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

  const renderFlashcardsView = () => {
    if (flashcardNotes.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <div className="text-7xl mb-6">🤔</div>
          <p className="text-2xl font-medium mb-4">No flashcards available</p>
          <p className="text-lg">
            Add some notes with selected text to create flashcards!
          </p>
        </div>
      );
    }

    const currentNote = flashcardNotes[currentFlashcardIndex];

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-3xl relative overflow-hidden border border-gray-100">
          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
            {currentNote.tags.map((tag) => (
              <span
                key={tag}
                className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-12 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">
              Selected Text
            </h2>
            <p className="text-gray-700 text-xl mb-10">
              {currentNote.selectedText}
            </p>

            {showFlashcardAnswer ? (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6 text-gray-800">
                  Notes
                </h3>
                <p className="text-gray-600 text-lg">
                  {currentNote.text || "No additional notes"}
                </p>
              </>
            ) : (
              <button
                onClick={() => setShowFlashcardAnswer(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg"
              >
                Show Answer
              </button>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center items-center gap-8">
            <button
              onClick={prevFlashcard}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-full transition-colors duration-200 shadow-md"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="text-gray-500 font-medium text-lg">
              {currentFlashcardIndex + 1} / {flashcardNotes.length}
            </div>
            <button
              onClick={nextFlashcard}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-4 rounded-full transition-colors duration-200 shadow-md"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-6 md:mb-0 flex items-center">
            {currentView === "notes" ? (
              <>
                <StickyNote className="mr-4 text-yellow-500" size={40} /> Notes
              </>
            ) : (
              <>
                <BookOpen className="mr-4 text-blue-500" size={40} /> Flashcards
              </>
            )}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setCurrentView((prev) =>
                  prev === "notes" ? "flashcards" : "notes"
                )
              }
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg text-lg font-semibold"
            >
              {currentView === "notes"
                ? "Switch to Flashcards Mode"
                : "Switch to Notes"}
              {currentView === "notes" ? (
                <BookOpen size={24} />
              ) : (
                <StickyNote size={24} />
              )}
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col md:flex-row gap-6">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg"
            />
            <Search
              className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={24}
            />
          </div>
          <div className="relative">
            <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-4 px-6 border border-gray-300 rounded-full shadow-md transition-colors duration-200 text-lg">
              <Filter size={24} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-10 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-base font-medium transition-all duration-200 ${
                selectedTags.includes(tag)
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Tag size={18} />
              {tag}
            </button>
          ))}
        </div>

        {currentView === "notes" ? renderNotesView() : renderFlashcardsView()}
      </div>
    </div>
  );
};

export default NotesManager;
