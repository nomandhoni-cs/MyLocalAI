import DOMPurify from "dompurify";
import { marked } from "marked";
import React, { useState, useEffect, useMemo } from "react";
import { X, BookOpen, StickyNote, Save } from "lucide-react";
import { storage } from "wxt/storage";
import NotesView from "./notes/NotesView";

interface Note {
  id: string;
  text: string;
  tags: string[];
  selectedText: string;
  createdAt: number;
}

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  originalText: string;
  tags: string[];
  createdAt: number;
}

const NotesManager: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [savedFlashcards, setSavedFlashcards] = useState<Flashcard[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<
    "notes" | "flashcards" | "saved-flashcards"
  >("notes");
  const [currentFlashcard, setCurrentFlashcard] = useState<{
    question: string;
    answer: string;
    originalText: string;
    tags: string[];
  } | null>(null);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [aiSession, setAiSession] = useState<any>(null);

  useEffect(() => {
    const initAiSession = async () => {
      const session = await ai.languageModel.create({
        systemPrompt:
          "Pretend to be a Flashcard expert of Active Recall Learning. If you get a text, you will make a question out of that and an answer.",
      });
      setAiSession(session);
    };

    const fetchInitialData = async () => {
      const storedNotes = (await storage.getItem<Note[]>("local:notes")) || [];
      const storedFlashcards =
        (await storage.getItem<Flashcard[]>("local:flashcards")) || [];

      setNotes(storedNotes);
      setSavedFlashcards(storedFlashcards);
    };

    initAiSession();
    fetchInitialData();
  }, []);

  const generateRandomFlashcard = async () => {
    if (!aiSession || notes.length === 0) return;

    setGeneratingFlashcards(true);

    // Filter notes that haven't been used for flashcards recently
    const eligibleNotes = notes.filter(
      (note) => note.selectedText.trim().length > 0
    );

    // If no eligible notes, return
    if (eligibleNotes.length === 0) {
      setGeneratingFlashcards(false);
      return;
    }

    // Select a random note
    const randomNote =
      eligibleNotes[Math.floor(Math.random() * eligibleNotes.length)];

    try {
      const result = await aiSession.prompt(randomNote.selectedText);

      // Extract question and answer using regex
      const questionMatch = result.match(/\*Question:\*\s*(.+)/);
      const answerMatch = result.match(/\*Answer:\*\s*(.+)/);

      if (questionMatch && answerMatch) {
        const flashcard = {
          question: questionMatch[1].trim(),
          answer: answerMatch[1].trim(),
          originalText: randomNote.selectedText,
          tags: randomNote.tags,
        };

        setCurrentFlashcard(flashcard);
        setCurrentView("flashcards");
      }
    } catch (error) {
      console.error("Error generating flashcard:", error);
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const saveFlashcard = async () => {
    if (!currentFlashcard) return;

    const newFlashcard: Flashcard = {
      id: `flashcard-${Date.now()}`,
      ...currentFlashcard,
      createdAt: Date.now(),
    };

    const updatedFlashcards = [...savedFlashcards, newFlashcard];
    setSavedFlashcards(updatedFlashcards);
    await storage.setItem("local:flashcards", updatedFlashcards);

    // Reset current flashcard
    setCurrentFlashcard(null);
    setCurrentView("saved-flashcards");
  };

  const deleteFlashcard = async (flashcardId: string) => {
    const updatedFlashcards = savedFlashcards.filter(
      (fc) => fc.id !== flashcardId
    );
    setSavedFlashcards(updatedFlashcards);
    await storage.setItem("local:flashcards", updatedFlashcards);
  };

  const renderSavedFlashcardsView = () => {
    if (savedFlashcards.length === 0) {
      return (
        <div className="text-center text-gray-500 py-10">
          <div className="text-7xl mb-6">📝</div>
          <p className="text-2xl font-medium mb-4">No saved flashcards</p>
          <button
            onClick={generateRandomFlashcard}
            disabled={generatingFlashcards}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg"
          >
            {generatingFlashcards
              ? "Generating..."
              : "Generate First Flashcard"}
          </button>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {savedFlashcards.map((flashcard) => (
          <div
            key={flashcard.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-gray-100"
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-wrap gap-2">
                  {flashcard.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => deleteFlashcard(flashcard.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                >
                  <X size={20} />
                </button>
              </div>
              <div
                className="text-gray-800 font-medium mb-4 text-lg"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked(flashcard.question)),
                }}
              />
              <div
                className="text-sm text-gray-600 italic mb-6"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked(flashcard.answer)),
                }}
              />
              <div className="text-xs text-gray-400">
                {new Date(flashcard.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFlashcardView = () => {
    if (!currentFlashcard) {
      return (
        <div className="text-center text-gray-500 py-10">
          <div className="text-7xl mb-6">🤔</div>
          <p className="text-2xl font-medium mb-4">No flashcard generated</p>
          <button
            onClick={generateRandomFlashcard}
            disabled={generatingFlashcards}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg"
          >
            {generatingFlashcards ? "Generating..." : "Generate Flashcard"}
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-3xl relative overflow-hidden border border-gray-100">
          <div className="absolute top-6 left-6 flex flex-wrap gap-2">
            {currentFlashcard.tags.map((tag) => (
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
              Flashcard Question
            </h2>
            <p className="text-gray-700 text-xl mb-10">
              {currentFlashcard.question}
            </p>

            {showFlashcardAnswer ? (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6 text-gray-800">
                  Answer
                </h3>
                <p className="text-gray-600 text-lg">
                  {
                    <div
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(marked(answer)),
                      }}
                    />
                  }
                </p>
                <div className="mt-6">
                  <h4 className="text-xl font-semibold text-gray-800">
                    Original Context
                  </h4>
                  <p className="text-gray-500 italic">
                    {currentFlashcard.originalText}
                  </p>
                </div>
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

          <div className="flex justify-center items-center gap-8">
            {!savedFlashcards.some(
              (fc) =>
                fc.question === currentFlashcard.question &&
                fc.answer === currentFlashcard.answer
            ) && (
              <button
                onClick={saveFlashcard}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
              >
                <Save size={20} /> Save Flashcard
              </button>
            )}
            <button
              onClick={generateRandomFlashcard}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg"
            >
              Generate New Flashcard
            </button>
          </div>
        </div>
      </div>
    );
  };

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

  const deleteNote = async (noteId: string) => {
    const updatedNotes = notes.filter((note) => note.id !== noteId);
    setNotes(updatedNotes);
    await storage.setItem("local:notes", updatedNotes);
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
            ) : currentView === "flashcards" ? (
              <>
                <BookOpen className="mr-4 text-blue-500" size={40} /> Flashcard
              </>
            ) : (
              <>
                <BookOpen className="mr-4 text-green-500" size={40} /> Saved
                Flashcards
              </>
            )}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                switch (currentView) {
                  case "notes":
                    setCurrentView("flashcards");
                    generateRandomFlashcard();
                    break;
                  case "flashcards":
                    setCurrentView("saved-flashcards");
                    break;
                  case "saved-flashcards":
                    setCurrentView("notes");
                    break;
                }
              }}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg text-lg font-semibold"
            >
              {currentView === "notes"
                ? "Switch to Flashcards"
                : currentView === "flashcards"
                ? "View Saved Flashcards"
                : "Back to Notes"}
              {currentView === "notes" ? (
                <BookOpen size={24} />
              ) : currentView === "flashcards" ? (
                <Save size={24} />
              ) : (
                <StickyNote size={24} />
              )}
            </button>
          </div>
        </div>

        {/* Rest of the existing UI remains the same */}
        {currentView === "notes" ? (
          <NotesView
            toggleTag={toggleTag}
            allTags={allTags}
            selectedTags={selectedTags}
            filteredNotes={filteredNotes}
            deleteNote={deleteNote}
            key={selectedTags.join()}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        ) : currentView === "flashcards" ? (
          renderFlashcardView()
        ) : (
          renderSavedFlashcardsView()
        )}
      </div>
    </div>
  );
};

export default NotesManager;
