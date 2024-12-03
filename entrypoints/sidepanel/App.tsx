import React from "react";

import Summarizer from "./components/Summarizer";
import Navbar from "./components/Navbar";
import Prompt from "./components/Promp";

const App: React.FC = () => {
  return (
    <div>
      <Navbar />
      <Summarizer />

      <Prompt />
    </div>
  );
};

export default App;
