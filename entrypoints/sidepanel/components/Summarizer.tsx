import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

const summaryOptions = {
  type: ["key-points", "tl;dr", "teaser", "headline"],
  length: ["short", "medium", "long"],
  format: ["markdown", "plain-text"],
};

const Summarizer: React.FC = () => {
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

  const handleSummarization = async () => {
    if (!pageContent) {
      updateWarning("There's nothing to summarize");
      return;
    }

    updateWarning(""); // Clear any previous warnings
    showSummary("Loading...");
    const summaryText = await generateSummary(pageContent);
    showSummary(summaryText);
  };

  useEffect(() => {
    // Fetch page content from chrome storage
    chrome.storage.session.get("pageContent", ({ pageContent }) => {
      setPageContent(pageContent);
    });

    // Listen for content changes
    const listener = (changes: any) => {
      const newContent = changes["pageContent"]?.newValue;
      if (newContent && newContent !== pageContent) {
        setPageContent(newContent);
      }
    };
    chrome.storage.session.onChanged.addListener(listener);

    // Cleanup listener
    return () => {
      chrome.storage.session.onChanged.removeListener(listener);
    };
  }, []);

  // Trigger summarization whenever pageContent changes
  useEffect(() => {
    if (pageContent) {
      handleSummarization();
    }
  }, [pageContent]);

  return (
    <div className="summarizer mt-4 px-4 py-2 rounded-2xl">
      <h2 className="text-xl font-semibold mb-2 border-b-2 border-gray-300">
        Summarizer
      </h2>
      {warning && <div className="warning">{warning}</div>}
      {summary && (
        <div
          className="summary rounded-2xl"
          dangerouslySetInnerHTML={{ __html: summary }}
        />
      )}
    </div>
  );
};

export default Summarizer;
