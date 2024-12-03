import React from "react";

import Summarizer from "./components/Summarizer";
import Navbar from "./components/Navbar";
import Prompt from "./components/Promp";

const App: React.FC = () => {
  const [triggerSummarization, setTriggerSummarization] = useState(false);

  const handleTriggerSummarization = () => {
    // Toggle the state to trigger summarization
    setTriggerSummarization((prev) => !prev);
  };
  return (
    <div>
      <Navbar handleTriggerSummarization={handleTriggerSummarization} />
      <Summarizer
        onTriggerSummarization={() => {
          if (triggerSummarization) {
            console.log("Summarization triggered from parent!");
          }
        }}
      />

      <Prompt />
    </div>
  );
};

export default App;
