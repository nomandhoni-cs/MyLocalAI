import React, {
  useState,
  useEffect,
  useRef,
  FormEvent,
  KeyboardEvent,
} from "react";
import { Info, Send, RefreshCw, Copy } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";

interface Message {
  type: "prompt" | "response";
  content: string;
}

const Prompt: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [session, setSession] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState({
    available: "no",
    maxTokens: 0,
    temperature: 0,
    tokensLeft: 0,
    tokensSoFar: 0,
    topK: 0,
  });
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [promptCost, setPromptCost] = useState<number | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check API availability
        const capabilities = await (
          window as any
        ).ai.languageModel.capabilities();

        if (capabilities.available !== "no") {
          // Create session with default parameters
          const newSession = await (window as any).ai.languageModel.create({
            temperature: capabilities.defaultTemperature,
            topK: capabilities.defaultTopK,
          });

          setSession(newSession);
          setSessionStats({
            available: capabilities.available,
            maxTokens: newSession.maxTokens,
            temperature: capabilities.defaultTemperature,
            tokensLeft: newSession.tokensLeft,
            tokensSoFar: newSession.tokensSoFar,
            topK: capabilities.defaultTopK,
          });
        } else {
          alert("AI language model is not available.");
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        alert("Failed to initialize AI session.");
      }
    };

    // Check if the Prompt API is available
    if ((window as any).ai?.languageModel) {
      initializeSession();
    } else {
      alert("Prompt API is not supported in this browser.");
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !session) return;

    const newPromptMessage: Message = {
      type: "prompt",
      content: prompt,
    };

    setMessages((prev) => [...prev, newPromptMessage]);
    setIsLoading(true);

    try {
      // Use the streaming approach with chunk processing
      let result = "";
      let previousChunk = "";
      const stream = await session.promptStreaming(prompt);

      for await (const chunk of stream) {
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk;

        result += newChunk;
        setMessages((prev) => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = {
            type: "response",
            content: DOMPurify.sanitize(marked.parse(result)),
          };
          return updatedMessages;
        });

        previousChunk = chunk;
      }

      // Update session stats
      setSessionStats((prev) => ({
        ...prev,
        tokensLeft: session.tokensLeft,
        tokensSoFar: session.tokensSoFar,
      }));
    } catch (error) {
      const errorMessage: Message = {
        type: "response",
        content: `Error: ${(error as Error).message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setPrompt("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const resetSession = async () => {
    try {
      // Destroy existing session if it exists
      if (session) {
        session.destroy();
      }

      // Recreate session
      const capabilities = await (
        window as any
      ).ai.languageModel.capabilities();
      const newSession = await (window as any).ai.languageModel.create({
        temperature: capabilities.defaultTemperature,
        topK: capabilities.defaultTopK,
      });

      setSession(newSession);
      setMessages([]);
      setSessionStats({
        available: capabilities.available,
        maxTokens: newSession.maxTokens,
        temperature: capabilities.defaultTemperature,
        tokensLeft: newSession.tokensLeft,
        tokensSoFar: newSession.tokensSoFar,
        topK: capabilities.defaultTopK,
      });
      setShowDetails(false);
    } catch (error) {
      console.error("Session reset error:", error);
      alert("Failed to reset AI session.");
    }
  };

  const copyLastResponse = () => {
    const lastResponse = messages[messages.length - 1]?.content || "";
    const plainTextResponse = lastResponse.replace(/<[^>]*>/g, "");

    navigator.clipboard
      .writeText(plainTextResponse)
      .then(() => {
        setCopiedMessage(plainTextResponse);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  // Rest of the component remains the same as in the original code
  // (rendering logic stays unchanged)

  return (
    <div className="flex flex-col max-w-4xl mx-auto">
      {/* Header with Info and Reset Buttons */}
      <div className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold">AI Chat</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 rounded-full transition-colors"
            title="Session Details"
          >
            <Info size={16} />
          </button>
          <button
            onClick={resetSession}
            className="p-1 rounded-full transition-colors"
            title="Reset Session"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-2 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2 "
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-grow p-3 border rounded-xl resize-none max-h-24 text-sm border-gray-200 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
          rows={2}
        />
        <div className="flex flex-col space-y-2">
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="p-2 rounded-full disabled:opacity-50 transition-colors bg-blue-500 dark:bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            title="Send Message"
          >
            <Send size={16} />
          </button>
        </div>
      </form>

      {/* Messages Container with Scrollbar */}
      <div className="flex-grow h-[420px] overflow-y-auto p-2 space-y-4 scrollbar scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-100 dark:scrollbar-track-gray-900">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`relative p-4 rounded-xl max-w-3xl mx-auto ${
              message.type === "prompt"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
            }`}
          >
            <div
              className="prose dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html:
                  message.type === "response"
                    ? message.content
                    : message.content.replace(/\n/g, "<br />"),
              }}
            />
            {message.type === "response" && (
              <button
                onClick={copyLastResponse}
                className="absolute top-2 right-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                title="Copy Response"
              >
                <Copy size={16} />
              </button>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="text-center italic text-gray-500 dark:text-gray-400 animate-pulse">
            Generating response...
          </div>
        )}
        {copiedMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white p-2 rounded-lg shadow-md">
            Response Copied!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* More Info Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 rounded-lg max-w-md w-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            <h2 className="text-xl font-bold mb-4">Session Details</h2>
            <div className="space-y-2">
              <p>Max Tokens: {sessionStats.maxTokens}</p>
              <p>Temperature: {sessionStats.temperature}</p>
              <p>Tokens Left: {sessionStats.tokensLeft}</p>
              <p>Tokens Used: {sessionStats.tokensSoFar}</p>
              <p>Top K: {sessionStats.topK}</p>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setShowDetails(false)}
                className="flex-grow p-2 rounded-lg text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={resetSession}
                className="flex-grow p-2 rounded-lg text-sm bg-blue-500 dark:bg-blue-700 text-white hover:bg-blue-600 dark:hover:bg-blue-600"
              >
                Reset Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prompt;
