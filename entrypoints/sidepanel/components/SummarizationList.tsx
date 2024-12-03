import React, { useEffect, useState } from "react";
import { storage } from "@wxt-dev/storage";
import { Trash, Copy } from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { copyToClipboard } from "../utils/copytoclipboard";

interface SummaryEntry {
  key: string;
  mainText: string;
  summary: string;
}

const SummarizationsList: React.FC = () => {
  const [summarizations, setSummarizations] = useState<SummaryEntry[]>([]);
  const [expandedSummaryKey, setExpandedSummaryKey] = useState<string | null>(
    null
  );
  const [showAll, setShowAll] = useState(false);

  // Fetch summarizations from storage
  const fetchSummarizations = async () => {
    try {
      const storedSummarizations = await storage.getItem<SummaryEntry[]>(
        "local:summarizations"
      );
      // Sort summarizations in descending order by `key` (latest first)
      const sortedSummarizations = (storedSummarizations || []).sort(
        (a, b) => new Date(b.key).getTime() - new Date(a.key).getTime()
      );
      setSummarizations(sortedSummarizations);
    } catch (error) {
      console.error("Error retrieving summarizations:", error);
    }
  };

  // Delete a specific summarization
  const deleteSummary = async (key: string) => {
    const updatedSummarizations = summarizations.filter(
      (entry) => entry.key !== key
    );
    setSummarizations(updatedSummarizations);
    await storage.setItem("local:summarizations", updatedSummarizations);
  };

  // Effect to fetch data on component mount
  useEffect(() => {
    fetchSummarizations();
  }, []);

  // Determine the displayed list based on `showAll`
  const displayedSummarizations = showAll
    ? summarizations
    : summarizations.slice(0, 2);

  // Render Markdown safely
  const renderMarkdown = (markdown: string) => {
    const sanitized = DOMPurify.sanitize(marked(markdown));
    return { __html: sanitized };
  };

  return (
    <div className="w-full mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4 text-center">
        Recent Summarizations
      </h1>
      {summarizations.length === 0 ? (
        <p className="text-gray-500 text-center">No summarizations found.</p>
      ) : (
        <div className="space-y-4">
          {displayedSummarizations.map((entry) => (
            <div
              key={entry.key}
              className="relative bg-white shadow rounded-lg p-3"
            >
              {/* Copy Button */}
              <button
                className="absolute top-2 right-2 text-black"
                onClick={() => copyToClipboard(entry.summary)}
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>

              {/* Summary Content */}
              <div
                className="text-gray-800 text-sm"
                dangerouslySetInnerHTML={
                  expandedSummaryKey === entry.key
                    ? renderMarkdown(entry.summary)
                    : renderMarkdown(
                        entry.summary.split(" ").slice(0, 20).join(" ") +
                          (entry.summary.split(" ").length > 20 ? "..." : "")
                      )
                }
              ></div>

              <div className="flex justify-between items-center mt-2">
                {/* Read More/Show Less Button */}
                {entry.summary.split(" ").length > 20 ? (
                  <button
                    className="text-blue-500 text-sm underline"
                    onClick={() =>
                      setExpandedSummaryKey(
                        expandedSummaryKey === entry.key ? null : entry.key
                      )
                    }
                  >
                    {expandedSummaryKey === entry.key
                      ? "Show Less"
                      : "Read More"}
                  </button>
                ) : (
                  <div></div>
                )}

                {/* Timestamp and Delete Button */}
                <div className="flex items-center space-x-4 text-gray-500 text-xs">
                  <span>{new Date(entry.key).toLocaleDateString()}</span>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteSummary(entry.key)}
                    title="Delete"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More/Show Less Button */}
      {summarizations.length > 2 && (
        <button
          className="mt-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 mx-auto block"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Show Less" : "See More"}
        </button>
      )}
    </div>
  );
};

export default SummarizationsList;
