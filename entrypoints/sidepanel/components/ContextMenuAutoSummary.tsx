import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import marked from 'marked';

const SummarizerComponent = () => {
  const [summary, setSummary] = useState('');
  const [warning, setWarning] = useState('');
  const [pageContent, setPageContent] = useState('');

  const MAX_MODEL_CHARS = 10000;

  // Function to summarize content (triggered by button or auto)
  const summarizeContent = async (text: string) => {
    try {
      const session = await createSummarizationSession();
      const summaryText = await session.summarize(text);
      session.destroy(); // Destroy session after use

      // Sanitize and display the summary
      const sanitizedSummary = DOMPurify.sanitize(marked.parse(summaryText));
      setSummary(sanitizedSummary);
    } catch (error: any) {
      setWarning('Error: ' + error.message);
    }
  };

  // Summarize content when context menu is clicked (auto)
  useEffect(() => {
    const handleContentChange = async (newContent: string) => {
      if (!newContent) {
        setWarning("There's nothing to summarize.");
        return;
      }
      if (newContent.length > MAX_MODEL_CHARS) {
        setWarning(`Text is too long for summarization. ${newContent.length} characters.`);
        return;
      }
      setWarning('');
      await summarizeContent(newContent);  // Summarize automatically when content changes
    };

    // Listen for changes in chrome.storage.session (triggered by context menu)
    const getSessionContent = () => {
      chrome.storage.session.get('pageContent', ({ pageContent }) => {
        if (pageContent && pageContent !== '') {
          handleContentChange(pageContent);
        }
      });
    };

    // Initial load
    getSessionContent();

    // Listen for session storage changes
    chrome.storage.session.onChanged.addListener((changes) => {
      if (changes.pageContent?.newValue) {
        handleContentChange(changes.pageContent.newValue);
      }
    });
  }, []);

  // Manual summarization by button click
  const handleButtonClick = () => {
    if (!pageContent) {
      setWarning('No content to summarize.');
      return;
    }
    summarizeContent(pageContent);  // Trigger summarization manually
  };

  // Function to create summarization session (same as before)
  const createSummarizationSession = async () => {
    if (!window.ai || !window.ai.summarizer) {
      throw new Error('AI Summarization is not supported in this browser');
    }

    const canSummarize = await window.ai.summarizer.capabilities();
    if (canSummarize.available === 'no') {
      throw new Error('AI Summarization is not available');
    }

    const summarizationSession = await window.ai.summarizer.create({
      type: 'key-points', // Use the desired summary type
      format: 'markdown', // Use the desired format
      length: 'medium',   // Use the desired summary length
    });

    if (canSummarize.available === 'after-download') {
      summarizationSession.addEventListener('downloadprogress', (progress) => {
        console.log(`Model download progress: ${progress.loaded / progress.total * 100}%`);
      });
      await summarizationSession.ready; // Wait for model download if needed
    }

    return summarizationSession;
  };

  return (
    <div>
      <h2>Summarizer</h2>
      {warning && <div className="warning" style={{ color: 'red' }}>{warning}</div>}
      <button onClick={handleButtonClick}>Summarize Current Page</button>
      <div
        style={{ padding: '10px', backgroundColor: '#f4f4f4' }}
        dangerouslySetInnerHTML={{ __html: summary }}
      />
    </div>
  );
};

export default SummarizerComponent;
