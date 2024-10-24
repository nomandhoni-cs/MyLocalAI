import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { styles } from "./styles";
import Summarizer from "./components/Summarizer";


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


  // // Summarizer functions end
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
      <Summarizer />

    </div>
  );
};

export default App;
