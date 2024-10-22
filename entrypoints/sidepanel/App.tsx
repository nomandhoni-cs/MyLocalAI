import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

const styles = {
  container: {
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    backgroundColor: "#f0f4f8",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    color: "#333",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "bold",
    color: "#555",
  },
  textarea: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    marginBottom: "10px",
    boxSizing: "border-box",
  },
  button: {
    padding: "8px 16px",
    fontSize: "14px",
    margin: "5px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  resetButton: {
    backgroundColor: "#f44336",
  },
  statsTable: {
    width: "100%",
    borderCollapse: "collapse",
    margin: "20px 0",
  },
  tableCell: {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
  },
  responseArea: {
    backgroundColor: "#fff",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    minHeight: "100px",
    marginTop: "10px",
  },
  summaryContainer: {
    padding: "20px",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    border: "1px solid #ddd",
    margin: "20px 0",
    color: "#333",
  },
  listItem: {
    marginBottom: "10px",
    fontSize: "16px",
    lineHeight: "1.6",
  },
  boldText: {
    fontWeight: "bold",
  },
};
const App: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState({
    maxTokens: 0,
    temperature: 0,
    tokensLeft: 0,
    tokensSoFar: 0,
    topK: 0,
  });
  const [cost, setCost] = useState(0);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState("");

  // Summarizer States 
  const [pageContent, setPageContent] = useState("");
  const [summary, setSummary] = useState("");
  const [warning, setWarning] = useState("");
  //  Summarizer states end 


  const sessionTopKRef = useRef<HTMLInputElement>(null);
  const sessionTemperatureRef = useRef<HTMLInputElement>(null);
  const responseAreaRef = useRef<HTMLDivElement>(null);

  const updateSession = async () => {
    const temperature = Number(sessionTemperatureRef.current?.value || 0);
    const topK = Number(sessionTopKRef.current?.value || 0);
    const newSession = await self.ai.languageModel.create({ temperature, topK });
    setSession(newSession);
    updateStats(newSession);
  };

  const updateStats = (newSession: any) => {
    if (!newSession) return;
    const { maxTokens, temperature, tokensLeft, tokensSoFar, topK } = newSession;
    setStats({ maxTokens, temperature, tokensLeft, tokensSoFar, topK });
  };

  const resetUI = () => {
    setResponse("");
    setRawResponse("");
    setCost(0);
    setStats({
      maxTokens: 0,
      temperature: 0,
      tokensLeft: 0,
      tokensSoFar: 0,
      topK: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await promptModel();
    setPrompt("");
  };

  const promptModel = async () => {
    const promptText = prompt.trim();
    if (!promptText) return;

    let fullResponse = "Generating response...";
    setResponse(fullResponse);

    if (!session) {
      await updateSession();
    }

    try {
      const stream = await session.promptStreaming(promptText);
      for await (const chunk of stream) {
        fullResponse = chunk.trim();
        const sanitizedResponse = DOMPurify.sanitize(marked.parse(fullResponse));
        setResponse(sanitizedResponse);
        setRawResponse(fullResponse);
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      updateStats(session);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  useEffect(() => {
    if (!session) {
      updateSession();
    }
  }, [session]);

  // Summarizer functions start
  const MAX_MODEL_CHARS = 4000;
  const summaryOptions: {
    type: AISummarizerType[],
    length: AISummarizerLength[],
    format: AISummarizerFormat[]
  } = {
    type: ["key-points", "tl;dr", "teaser", "headline"],
    length: ["short", "medium", "long"],
    format: ["markdown", "plain-text"]
  };

  useEffect(() => {
    const onContentChange = async (newContent: string) => {
      if (pageContent === newContent) return;
      setPageContent(newContent);

      let summaryText;
      if (newContent) {
        if (newContent.length > MAX_MODEL_CHARS) {
          updateWarning(
            `Text is too long for summarization with ${newContent.length} characters (maximum supported content length is ~4000 characters).`
          );
        } else {
          updateWarning('');
        }
        showSummary('Loading...');
        summaryText = await generateSummary(newContent);
      } else {
        summaryText = "There's nothing to summarize";
      }
      console.log(summaryText);
      showSummary(summaryText);
    };

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
        session.destroy(); // Destroying the session after use
        return summary;
      } catch (e: any) {
        return 'Error: ' + e.message;
      }
    };

    const createSummarizationSession = async () => {
      if (!window.ai || !window.ai.summarizer) {
        throw new Error('AI Summarization is not supported in this browser');
      }

      const canSummarize = await window.ai.summarizer.capabilities();
      if (canSummarize.available === 'no') {
        throw new Error('AI Summarization is not available');
      }

      const summarizationSession = await window.ai.summarizer.create({
        type: summaryOptions.type[0],   // 'key-points'
        format: summaryOptions.format[0],  // 'markdown'
        length: summaryOptions.length[1]    // 'medium'
      } as AISummarizerCreateOptions);

      if (canSummarize.available === 'after-download') {
        summarizationSession.addEventListener('downloadprogress', (progress) => {
          console.log(`Model download progress: ${progress.loaded / progress.total * 100}%`);
        });
        await summarizationSession.ready; // Wait for the model to be ready if it needs downloading
        console.log(summarizationSession)

      }

      return summarizationSession;
    };

    // Example of using chrome.storage or any content change listener
    chrome.storage.session.get('pageContent', ({ pageContent }) => {
      onContentChange(pageContent);
    });

    chrome.storage.session.onChanged.addListener((changes) => {
      const newContent = changes['pageContent']?.newValue;
      onContentChange(newContent);
    });
    console.log(pageContent);
  }, [pageContent]);

  // Summarizer functions end
  const handleCopy = () => {
    navigator.clipboard.writeText(rawResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
  };
  return (
    <div style={styles.container}>
      <div id="error-message">{error}</div>
      <div id="prompt-area">
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Prompt</label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={handleInputChange}
            style={styles.textarea}
          />
          <button type="submit" id="submit-button" style={styles.button}>
            Submit prompt
          </button>
          <button
            type="button"
            id="reset-button"
            onClick={resetUI}
            style={{ ...styles.button, ...styles.resetButton }}
          >
            Reset session
          </button>
          <span id="cost">{cost} tokens</span>
          <div className="settings">
            <label htmlFor="session-top-k" style={styles.label}>
              Top-k
            </label>
            <input id="session-top-k" min={1} type="number" ref={sessionTopKRef} />
            <label htmlFor="session-temperature" style={styles.label}>
              Temperature
            </label>
            <input
              id="session-temperature"
              type="number"
              step="any"
              min={0}
              ref={sessionTemperatureRef}
            />
          </div>
        </form>
        <h2>Session stats</h2>
        <table style={styles.statsTable}>
          <thead>
            <tr>
              <th style={styles.tableCell}>Temperature</th>
              <th style={styles.tableCell}>Top-k</th>
              <th style={styles.tableCell}>Tokens so far</th>
              <th style={styles.tableCell}>Tokens left</th>
              <th style={styles.tableCell}>Total tokens</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td id="temperature" style={styles.tableCell}>
                {stats.temperature}
              </td>
              <td id="top-k" style={styles.tableCell}>
                {stats.topK}
              </td>
              <td id="tokens-so-far" style={styles.tableCell}>
                {stats.tokensSoFar}
              </td>
              <td id="tokens-left" style={styles.tableCell}>
                {stats.tokensLeft}
              </td>
              <td id="max-tokens" style={styles.tableCell}>
                {stats.maxTokens}
              </td>
            </tr>
          </tbody>
        </table>
        <h2>Conversation</h2>
        <div
          id="response-area"
          ref={responseAreaRef}
          style={styles.responseArea}
          dangerouslySetInnerHTML={{ __html: response }}
        />
        <details>
          <summary>Raw response</summary>
          <div>{rawResponse}</div>
        </details>
        <button onClick={handleCopy} id="copy-link-button" style={styles.button}>
        {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <h2>Summarizer</h2>
      {warning && <div className="warning" style={{ color: 'red' }}>{warning}</div>}
      <div
        style={styles.summaryContainer}
        dangerouslySetInnerHTML={{ __html: summary }}
      />

    </div>
  );
};

export default App;
