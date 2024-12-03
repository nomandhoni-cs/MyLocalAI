import { Layers3, MessageCircleIcon, Scroll } from "lucide-react";
import { ThemeChanger } from "./ThemeChanger";
import reactLogo from "@/assets/react.svg";

const Navbar = ({ handleTriggerSummarization, showSummarizer }) => {
  return (
    <div className="flex justify-center items-center w-full mx-auto pt-2">
      <div className="flex items-center space-x-2">
        <img src={reactLogo} alt="MyLocal AI Logo" className="logo h-8 w-8" />
        <nav className="flex items-center h-10 px-4 space-x-2 bg-gradient-to-r from-[#9168C0] via-[#5684D1] to-[#1BA1E3] rounded-full shadow-lg">
          <ThemeChanger />
          <div className="w-px h-6 bg-white/20" />
          <a
            href="/flashcards.html"
            target="_blank"
            className="flex items-center text-base text-white hover:text-white/80 transition-colors"
          >
            <Layers3 className="h-5 w-5 mr-2" />
            Flashcards
          </a>
          <div className="w-px h-6 bg-white/20" />
          <a
            href="#summary"
            onClick={handleTriggerSummarization}
            className="flex items-center text-base text-white hover:text-white/80 transition-colors"
          >
            {!showSummarizer ? (
              <Scroll className="h-5 w-5 mr-2" />
            ) : (
              <MessageCircleIcon className="h-5 w-5 mr-2" />
            )}
            {!showSummarizer ? "Get Summary" : "Chat with AI"}
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Navbar;
