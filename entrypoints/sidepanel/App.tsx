import React, { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import Summarizer from "./components/Summarizer";
import { SunIcon, SettingsIcon, CopyIcon, RefreshCcwIcon } from "lucide-react";
import SummarizationsList from "./components/SummarizationList";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cost, setCost] = useState(0);
  const [error, setError] = useState("");
  const [rawResponse, setRawResponse] = useState("");

  const sessionTopKRef = useRef<HTMLInputElement>(null);
  const sessionTemperatureRef = useRef<HTMLInputElement>(null);
  const responseAreaRef = useRef<HTMLDivElement>(null);

  const updateSession = async () => {
    const temperature = Number(sessionTemperatureRef.current?.value || 0);
    const topK = Number(sessionTopKRef.current?.value || 0);
    const newSession = await self.ai.languageModel.create({
      temperature,
      topK,
    });
    setSession(newSession);
    updateStats(newSession);
  };

  const updateStats = (newSession: any) => {
    if (!newSession) return;
    const { maxTokens, temperature, tokensLeft, tokensSoFar, topK } =
      newSession;
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
        const sanitizedResponse = DOMPurify.sanitize(
          marked.parse(fullResponse)
        );
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
    <div className="w-full mx-auto p-1 space-y-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
      {error && <div className="text-red-500">{error}</div>}
      <SummarizationsList />

      {/* <Summarizer />  */}

      {/* Chat Interface */}
      <div className="space-y-6">
        {/* Prompt Area */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={handleInputChange}
            placeholder="Type your prompt here..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="flex justify-between">
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              <SunIcon className="w-4 h-4 mr-2" />
              Submit
            </button>
            <button
              type="button"
              onClick={resetUI}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              <RefreshCcwIcon className="w-4 h-4 mr-2" />
              Reset
            </button>
          </div>
        </form>

        {/* Response Area */}
        <div className="p-4 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            AI Response
          </h2>
          <div
            ref={responseAreaRef}
            dangerouslySetInnerHTML={{ __html: response }}
          />
          <button
            onClick={handleCopy}
            className="mt-4 flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            <CopyIcon className="w-4 h-4 mr-2" />
            {isCopied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Settings Button */}
      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700"
      >
        <SettingsIcon className="w-5 h-5" />
      </button>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-700 p-6 rounded-md space-y-4 shadow-lg w-96">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Settings
            </h2>
            <div className="flex items-center">
              <label className="mr-4">Top-k</label>
              <input
                type="number"
                ref={sessionTopKRef}
                className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100"
                min={1}
              />
            </div>
            <div className="flex items-center">
              <label className="mr-4">Temperature</label>
              <input
                type="number"
                ref={sessionTemperatureRef}
                step="any"
                className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-100"
                min={0}
              />
            </div>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
