import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

const MAX_MODEL_CHARS = 4000;
const summaryOptions = {
  type: ["key-points", "tl;dr", "teaser", "headline"],
  length: ["short", "medium", "long"],
  format: ["markdown", "plain-text"],
};

const Summarizer = () => {
  const [pageContent, setPageContent] = useState("");
  const [summary, setSummary] = useState("");
  const [warning, setWarning] = useState("");

  const updateWarning = (warningText: string) => {
    setWarning(warningText);
  };

  const showSummary = (summaryText: string) => {
    const sanitizedSummary = DOMPurify.sanitize(marked.parse(summaryText));
    setSummary(sanitizedSummary);
  };

  const generateSummary = async (text: string) => {
    try {
      const session = await createSummarizationSession();
      const summary = await session.summarize(text);
      session.destroy(); // Destroy the session after use
      return summary;
    } catch (e: any) {
      return "Error: " + e.message;
    }
  };

  const createSummarizationSession = async () => {
    if (!window.ai || !window.ai.summarizer) {
      throw new Error("AI Summarization is not supported in this browser");
    }

    const canSummarize = await window.ai.summarizer.capabilities();
    if (canSummarize.available === "no") {
      throw new Error("AI Summarization is not available");
    }

    const summarizationSession = await window.ai.summarizer.create({
      type: summaryOptions.type[0], // 'key-points'
      format: summaryOptions.format[0], // 'markdown'
      length: summaryOptions.length[1], // 'medium'
    } as AISummarizerCreateOptions);

    if (canSummarize.available === "after-download") {
      summarizationSession.addEventListener("downloadprogress", (progress) => {
        console.log(
          `Model download progress: ${
            (progress.loaded / progress.total) * 100
          }%`
        );
      });
      await summarizationSession.ready; // Wait for the model to be ready if it needs downloading
    }

    return summarizationSession;
  };

  const handleSummarizeClick = async () => {
    if (!pageContent) {
      updateWarning("There's nothing to summarize");
      return;
    }

    if (pageContent.length > MAX_MODEL_CHARS) {
      updateWarning(
        `Text is too long for summarization with ${pageContent.length} characters (maximum supported content length is ~4000 characters).`
      );
      return;
    }

    updateWarning(""); // Clear any previous warnings
    showSummary("Loading...");
    const summaryText = await generateSummary(pageContent);
    showSummary(summaryText);
  };

  useEffect(() => {
    // Example of using chrome.storage or any content change listener
    chrome.storage.session.get("pageContent", ({ pageContent }) => {
      setPageContent(pageContent);
    });

    chrome.storage.session.onChanged.addListener((changes) => {
      const newContent = changes["pageContent"]?.newValue;
      if (pageContent !== newContent) {
        setPageContent(newContent);
      }
    });
  }, [pageContent]);

  return (
    <div className="p-6 space-y-6 ">
      <h2 className="text-2xl font-bold">Summarizer</h2>
      <button
        onClick={handleSummarizeClick}
        className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      >
        Summarize Current Page
      </button>
      {warning && (
        <div className="mt-4 text-red-500 font-semibold" role="alert">
          {warning}
        </div>
      )}
      <div
        className="mt-6 p-4 border border-gray-300 dark:border-gray-700 rounded-md"
        dangerouslySetInnerHTML={{ __html: summary }}
      />
    </div>
  );
};

export default Summarizer;
