import React, { useState } from "react";

import Summarizer from "./components/Summarizer";
import Navbar from "./components/Navbar";
import Prompt from "./components/Promp";

const App: React.FC = () => {
  const [showSummarizer, setShowSummarizer] = useState(false);

  // Toggle function to handle summarizer visibility and prompt visibility
  const handleTriggerSummarization = () => {
    setShowSummarizer((prevState) => !prevState); // Toggle visibility
  };

  return (
    <div>
      <Navbar
        handleTriggerSummarization={handleTriggerSummarization}
        showSummarizer={showSummarizer}
      />

      {/* Conditionally render Summarizer and Prompt */}
      {showSummarizer ? (
        <Summarizer
          onTriggerSummarization={() => {
            console.log("Summarizer triggered!");
          }}
        />
      ) : (
        <Prompt />
      )}
    </div>
  );
};

export default App;
