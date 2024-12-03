import "../main.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "next-themes";
import Navbar from "./components/Navbar";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
