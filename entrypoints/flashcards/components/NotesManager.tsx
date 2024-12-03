import DOMPurify from "dompurify";
import { marked } from "marked";
import React, { useState, useEffect, useMemo } from "react";
import { X, BookOpen, StickyNote, Save, RefreshCcw, Eye } from "lucide-react";
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
    "notes" | "flashcards" | "saved-flashcards" | "practice-flashcards"
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

  // Practice mode states
  const [practiceFlashcards, setPracticeFlashcards] = useState<Flashcard[]>([]);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);

  useEffect(() => {
    const initAiSession = async () => {
      const session = await ai.languageModel.create({
        systemPrompt:
          "Act as a Flashcard expert specializing in Active Recall Learning. When given a text, generate a corresponding question based on the content and provide a concise answer.",
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
    if (!aiSession) {
      console.error("AI session not initialized.");
      return;
    }

    if (notes.length === 0) {
      console.warn("No notes available to generate flashcards.");
      return;
    }

    // Filter notes with non-empty selectedText
    const eligibleNotes = notes.filter(
      (note) => note.selectedText.trim().length > 0
    );

    if (eligibleNotes.length === 0) {
      console.warn("No eligible notes with selectedText available.");
      return;
    }

    // Select a random note
    const randomNote =
      eligibleNotes[Math.floor(Math.random() * eligibleNotes.length)];
    console.log("Selected note for flashcard generation:", randomNote);

    setGeneratingFlashcards(true);
    setShowFlashcardAnswer(false);

    try {
      // Create an AbortController to handle potential cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      // Use AI session to generate a flashcard
      const result = await aiSession.prompt(randomNote.selectedText, {
        signal: controller.signal,
      });

      // Clear the timeout if successful
      clearTimeout(timeoutId);

      console.log("AI session response:", result);

      // More robust parsing of question and answer
      const questionRegex = /Question:\s*(.+?)(?=\s*Answer:|\s*$)/s;
      const answerRegex = /Answer:\s*(.+)/s;

      const questionMatch = result.match(questionRegex);
      const answerMatch = result.match(answerRegex);

      if (questionMatch && answerMatch) {
        const flashcard = {
          question: questionMatch[1].trim(),
          answer: answerMatch[1].trim(),
          originalText: randomNote.selectedText,
          tags: randomNote.tags,
        };

        console.log("Generated flashcard:", flashcard);
        setCurrentFlashcard(flashcard);
        setCurrentView("flashcards");
      } else {
        console.error("Failed to parse flashcard question or answer:", result);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.warn("Flashcard generation was cancelled or timed out.");
      } else {
        console.error("Error generating flashcard:", error);
      }
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const startPracticeMode = () => {
    if (savedFlashcards.length === 0) return;

    // Shuffle flashcards for practice
    const shuffledFlashcards = [...savedFlashcards].sort(
      () => Math.random() - 0.5
    );

    setPracticeFlashcards(shuffledFlashcards);
    setCurrentPracticeIndex(0);
    setShowPracticeAnswer(false);
    setCurrentView("practice-flashcards");
  };

  const nextPracticeFlashcard = () => {
    setShowPracticeAnswer(false);
    if (currentPracticeIndex < practiceFlashcards.length - 1) {
      setCurrentPracticeIndex((prev) => prev + 1);
    } else {
      // End of practice session
      setCurrentView("saved-flashcards");
    }
  };

  const renderPracticeFlashcardView = () => {
    if (
      practiceFlashcards.length === 0 ||
      currentPracticeIndex >= practiceFlashcards.length
    ) {
      return (
        <div className="text-center text-gray-500 py-10">
          <div className="text-7xl mb-6">✅</div>
          <p className="text-2xl font-medium mb-4">Practice Complete!</p>
          <button
            onClick={() => setCurrentView("saved-flashcards")}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200"
          >
            Back to Saved Flashcards
          </button>
        </div>
      );
    }

    const currentFlashcard = practiceFlashcards[currentPracticeIndex];

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
            <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
              {currentPracticeIndex + 1} / {practiceFlashcards.length}
            </span>
          </div>

          <div className="mt-12 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">
              Practice Flashcard
            </h2>
            <p className="text-gray-700 text-xl mb-10">
              {currentFlashcard.question}
            </p>

            {showPracticeAnswer ? (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6 text-gray-800">
                  Answer
                </h3>
                <p className="text-gray-600 text-lg">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        marked(currentFlashcard.answer)
                      ),
                    }}
                  />
                </p>
                <div className="mt-6">
                  <h4 className="text-xl font-semibold text-gray-800">
                    Original Context
                  </h4>
                  <div className="text-gray-500 italic" dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(currentFlashcard.originalText)),
                  }}/>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowPracticeAnswer(true)}
                className="border-2 border-blue-500 text-blue-500 font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg"
              >
                Show Answer
              </button>
            )}
          </div>

          <div className="flex justify-center items-center gap-8">
            <button
              onClick={nextPracticeFlashcard}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 px-8 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              {currentPracticeIndex < practiceFlashcards.length - 1
                ? "Next Flashcard"
                : "Finish Practice"}
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      </div>
    );
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
      <div>
        <div className="flex justify-end mb-4">
          {savedFlashcards.length > 0 && (
            <button
              onClick={startPracticeMode}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <Eye size={20} /> Start Practice
            </button>
          )}
        </div>
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
      </div>
    );
  };

  // Modify the view switching logic to include practice view
  const renderCurrentView = () => {
    switch (currentView) {
      case "notes":
        return (
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
        );
      case "flashcards":
        return renderFlashcardView();
      case "saved-flashcards":
        return renderSavedFlashcardsView();
      case "practice-flashcards":
        return renderPracticeFlashcardView();
      default:
        return null;
    }
  };

  // Update the view switching button to handle practice mode
  const switchViewButton = () => {
    switch (currentView) {
      case "notes":
        return {
          text: "Switch to Flashcards",
          icon: <BookOpen size={24} />,
          action: () => {
            setCurrentView("flashcards");
            generateRandomFlashcard();
          },
        };
      case "flashcards":
        return {
          text: "View Saved Flashcards",
          icon: <Save size={24} />,
          action: () => setCurrentView("saved-flashcards"),
        };
      case "saved-flashcards":
        return {
          text: "Back to Notes",
          icon: <StickyNote size={24} />,
          action: () => setCurrentView("notes"),
        };
      case "practice-flashcards":
        return {
          text: "Back to Saved Flashcards",
          icon: <BookOpen size={24} />,
          action: () => setCurrentView("saved-flashcards"),
        };
      default:
        return {
          text: "Switch View",
          icon: <BookOpen size={24} />,
          action: () => setCurrentView("notes"),
        };
    }
  };

  const renderFlashcardView = () => {
    if (!currentFlashcard) {
      return (
        <div className="text-center text-gray-500 py-10">
          <div className="text-7xl mb-6">🤔</div>
          <p className="text-2xl font-medium mb-4">Generating a flashcard for you</p>
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
            < div className="text-gray-700 text-xl mb-10" dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked(currentFlashcard.question)),
                  }}/>

            {showFlashcardAnswer ? (
              <>
                <h3 className="text-2xl font-semibold mt-10 mb-6 text-gray-800">
                  Answer
                </h3>
                <p className="text-gray-600 text-lg">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        marked(currentFlashcard.answer)
                      ),
                    }}
                  />
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
      <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-5">
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
            <button
              onClick={switchViewButton().action}
              className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full transition-colors duration-200 transform hover:scale-105 shadow-lg text-lg font-semibold"
            >
              {switchViewButton().text}
              {switchViewButton().icon}
            </button>
          </div>

          {renderCurrentView()}
        </div>
      </div>
  );
};

export default NotesManager;
