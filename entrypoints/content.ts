import DOMPurify from "dompurify";
import { isProbablyReaderable, Readability } from "@mozilla/readability";
import { marked } from "marked";
console.log("test");
let isSummaryDisplayed = false;
const summaryOptions = {
  type: ["key-points", "tl;dr", "teaser", "headline"] as AISummarizerType[],
  length: ["short", "medium", "long"] as AISummarizerLength[],
  format: ["markdown", "plain-text"] as AISummarizerFormat[],
};

// Document Parsing start
function canBeParsed(document: Document) {
  return isProbablyReaderable(document, {
    minContentLength: 100,
  });
}

function parse(document: Document) {
  if (!canBeParsed(document)) {
    return false;
  }
  const documentClone = document.cloneNode(true);
  const article = new Readability(documentClone as Document).parse();
  return article;
}

// Add Sticky Button start
function addStickyButton() {
  const button = createStickyButton();
  styleStickyButton(button);

  button.onclick = async function () {
    const parsedData = parse(window.document);
    const textHaveToBeSummarized = parsedData?.textContent;

    if (textHaveToBeSummarized) {
      if (isSummaryDisplayed) {
        // If summary is already displayed, remove it
        removeSummaryElement();
      } else {
        // If summary is not displayed, show "Summarizing the text"
        createSummaryElement("Summarizing the text...");

        // Wait for the summarization to complete
        const summary = await summarizeText(textHaveToBeSummarized);
        // Update the summary div with the actual summary
        updateSummaryElement(summary);
      }
    } else {
      alert("This page cannot be summarized.");
    }
  };

  document.body.appendChild(button);
}

// Create the summary element
function createSummaryElement(summary: string) {
  const summaryDiv = document.createElement("div");
  summaryDiv.setAttribute("id", "summarized_text_div");
  summaryDiv.innerHTML = `
    <div style="position: fixed; bottom: 9%; right: 5%; width: 300px; max-height: 550px; overflow-y: auto; padding: 20px; background-color: white; border-radius: 10px; border: 1px solid currentColor; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); z-index: 1000;">
      <div style="position: relative;">
        <button id="close-summary" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 16px; cursor: pointer; color: black">✕</button>
        <h3 style="color: black; font: bold 18px sans-serif; margin-bottom: 10px;">Summary</h3>
        <p style="color: black">${summary}</p>
      </div>
    </div>
  `;

  document.body.appendChild(summaryDiv);
  isSummaryDisplayed = true;

  // Close button functionality
  const closeButton = summaryDiv.querySelector("#close-summary");
  closeButton?.addEventListener("click", () => {
    removeSummaryElement();
  });
}

// Remove summary element
function removeSummaryElement() {
  const summaryDiv = document.querySelector("#summarized_text_div");
  if (summaryDiv) {
    summaryDiv.remove();
    isSummaryDisplayed = false;
  }
}

// Update summary element with the actual summary
function updateSummaryElement(markdownSummary: string) {
  const summaryDiv = document.querySelector("#summarized_text_div");
  if (summaryDiv) {
    const summaryParagraph = summaryDiv.querySelector("p");
    if (summaryParagraph) {
      // Convert markdown to HTML and sanitize
      const htmlSummary = DOMPurify.sanitize(marked(markdownSummary));
      summaryParagraph.innerHTML = htmlSummary; // Update the paragraph with the sanitized HTML summary
    }
  }
}

// Summarize text using the AI Summarizer API
async function summarizeText(text: string): Promise<string> {
  try {
    const summarizationSession = await createSummarizationSession(
      summaryOptions.type[0], // 'key-points'
      summaryOptions.format[1], // 'markdown'
      summaryOptions.length[1] // 'medium'
    );

    const summary = await summarizationSession.summarize(text);
    summarizationSession.destroy(); // Clean up the session
    return summary;
  } catch (error) {
    console.error("Summarization failed: ", error);
    return "Failed to summarize the content.";
  }
}

// Helper function to create summarization session
async function createSummarizationSession(
  type: AISummarizerType,
  format: AISummarizerFormat,
  length: AISummarizerLength,
  downloadProgressCallback?: AIModelDownloadCallback
): Promise<AISummarizerSession> {
  const canSummarize = await window.ai.summarizer!.capabilities();
  if (canSummarize.available === "no") {
    throw new Error("AI Summarization is not supported");
  }

  const summarizationSession = await window.ai.summarizer!.create({
    type,
    format,
    length,
  });
  if (canSummarize.available === "after-download") {
    if (downloadProgressCallback) {
      summarizationSession.addEventListener(
        "downloadprogress",
        downloadProgressCallback
      );
    }
    await summarizationSession.ready;
  }

  return summarizationSession;
}

// Write and Rewrite start
let btnContainer = createButtonContainer();

function onFocusIn(event) {
  const el = event.target;
  if (
    el.contentEditable &&
    el.matches("input, textarea") &&
    el.type.match(/email|number|search|text|url/)
  ) {
    appendButton(el);
  }
}

function appendButton(textElement) {
  // Remove existing button container if it exists
  const existingContainer = document.querySelector(".ai-button-container");
  if (existingContainer) existingContainer.remove();

  const parentElement = textElement.parentElement;
  parentElement.style.position = "relative";

  btnContainer.className = "ai-button-container";
  btnContainer.style.position = "absolute";
  btnContainer.style.top = "2%";
  btnContainer.style.right = "2%";
  btnContainer.style.zIndex = "9999";

  parentElement.insertBefore(btnContainer, textElement.nextElementSibling);
}

function createButtonContainer() {
  // Create a container for both Write and Rewrite buttons
  const container = document.createElement("div");
  container.style.display = "inline-flex";
  container.style.gap = "10px"; // Gap between buttons

  // Create Write button
  const writeButton = document.createElement("button");
  writeButton.textContent = "Write";
  writeButton.style.padding = "5px";
  writeButton.onclick = async (event) => {
    event.preventDefault();
    await handleWrite();
  };
  container.appendChild(writeButton);

  // Create Rewrite button
  const rewriteButton = document.createElement("button");
  rewriteButton.textContent = "Rewrite";
  rewriteButton.style.padding = "5px";
  rewriteButton.onclick = async (event) => {
    event.preventDefault();
    await handleRewrite();
  };
  container.appendChild(rewriteButton);

  return container;
}

async function handleWrite() {
  const userInput = prompt("Enter text to write:");
  if (!userInput) return;

  // Call the AI writer API and get the response (mocked here)
  const aiResponse = await self.ai.writer
    .create({
      tone: "neutral", // You can adjust the tone, format, etc.
      length: "medium",
      format: "plain",
    })
    .writeStreaming(userInput);

  let fullResponse = "";
  for await (const chunk of aiResponse) {
    fullResponse += chunk.trim();
  }

  const focusedElement = document.activeElement;
  if (focusedElement.matches("input, textarea")) {
    focusedElement.value = fullResponse;
  } else if (focusedElement.contentEditable) {
    focusedElement.innerHTML = DOMPurify.sanitize(fullResponse);
  }
}

async function handleRewrite() {
  const focusedElement = document.activeElement;
  let currentText = "";

  if (focusedElement.matches("input, textarea")) {
    currentText = focusedElement.value;
  } else if (focusedElement.contentEditable) {
    currentText = focusedElement.innerText;
  }

  if (!currentText) return alert("No text found to rewrite.");

  // Call the AI rewriter API and get the response (mocked here)
  const aiResponse = await self.ai.rewriter
    .create({
      tone: "neutral", // Adjust settings as necessary
      length: "medium",
      format: "plain",
    })
    .rewriteStreaming(currentText);

  let fullResponse = "";
  for await (const chunk of aiResponse) {
    fullResponse += chunk.trim();
  }

  if (focusedElement.matches("input, textarea")) {
    focusedElement.value = fullResponse;
  } else if (focusedElement.contentEditable) {
    focusedElement.innerHTML = DOMPurify.sanitize(fullResponse);
  }
}
// Write and Rewrite end
export default defineContentScript({
  matches: ["https://*/*"],
  main() {
    const isReadable = canBeParsed(window.document);
    console.log(isReadable);
    if (isReadable) {
      addStickyButton();
    }
    document.addEventListener("focusin", onFocusIn);

    console.log("Content script initialized.");
  },
});

// Style Section start
// Sticky Button style start
function createStickyButton() {
  const button = document.createElement("button");

  const img = document.createElement("img");
  img.src =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgMzQzLjI2IDM0My4yNiI+CiAgPGRlZnM+CiAgICA8c3R5bGU+CiAgICAgIC5jbHMtMSB7CiAgICAgICAgZmlsbDogdXJsKCNsaW5lYXItZ3JhZGllbnQpOwogICAgICB9CgogICAgICAuY2xzLTEsIC5jbHMtMiwgLmNscy0zLCAuY2xzLTQsIC5jbHMtNSB7CiAgICAgICAgc3Ryb2tlLXdpZHRoOiAwcHg7CiAgICAgIH0KCiAgICAgIC5jbHMtMiB7CiAgICAgICAgZmlsbDogdXJsKCNsaW5lYXItZ3JhZGllbnQtMik7CiAgICAgIH0KCiAgICAgIC5jbHMtMyB7CiAgICAgICAgZmlsbDogdXJsKCNsaW5lYXItZ3JhZGllbnQtMyk7CiAgICAgIH0KCiAgICAgIC5jbHMtNCB7CiAgICAgICAgZmlsbDogI2ZmZjsKICAgICAgfQoKICAgICAgLmNscy01IHsKICAgICAgICBmaWxsOiB1cmwoI2xpbmVhci1ncmFkaWVudC00KTsKICAgICAgfQogICAgPC9zdHlsZT4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50IiB4MT0iLTU2Mi4zMiIgeTE9Ii01MzQuOTQiIHgyPSItNjg2LjA0IiB5Mj0iLTkxNi42MSIgZ3JhZGllbnRUcmFuc2Zvcm09InRyYW5zbGF0ZSgtNTY3LjI4IDgzNi43MSkgcm90YXRlKDkwKSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiPgogICAgICA8c3RvcCBvZmZzZXQ9Ii4yMSIgc3RvcC1jb2xvcj0iIzkwNjRiYiIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii4yMyIgc3RvcC1jb2xvcj0iIzhhNjdiZCIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii4zMSIgc3RvcC1jb2xvcj0iIzc4NzJjMyIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii4zOSIgc3RvcC1jb2xvcj0iIzZlNzhjNyIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii40OSIgc3RvcC1jb2xvcj0iIzZiN2JjOSIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii40OSIgc3RvcC1jb2xvcj0iIzY5N2JjOSIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii41NiIgc3RvcC1jb2xvcj0iIzUxODZkMiIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii42MyIgc3RvcC1jb2xvcj0iIzQxOGVkOSIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii43MSIgc3RvcC1jb2xvcj0iIzM3OTJkYyIvPgogICAgICA8c3RvcCBvZmZzZXQ9Ii44MSIgc3RvcC1jb2xvcj0iIzM0OTRkZSIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50LTIiIHgxPSItNjg3LjYiIHkxPSItNDk0LjMzIiB4Mj0iLTgxMS4zMyIgeTI9Ii04NzYiIHhsaW5rOmhyZWY9IiNsaW5lYXItZ3JhZGllbnQiLz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyLWdyYWRpZW50LTMiIHgxPSItNTAzLjQ1IiB5MT0iLTU1NC4wMiIgeDI9Ii02MjcuMTgiIHkyPSItOTM1LjY5IiB4bGluazpocmVmPSIjbGluZWFyLWdyYWRpZW50Ii8+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhci1ncmFkaWVudC00IiB4MT0iLTYyOC42MyIgeTE9Ii01MTMuNDUiIHgyPSItNzUyLjM2IiB5Mj0iLTg5NS4xMiIgeGxpbms6aHJlZj0iI2xpbmVhci1ncmFkaWVudCIvPgogIDwvZGVmcz4KICA8ZyBpZD0iTGF5ZXJfMS0yIiBkYXRhLW5hbWU9IkxheWVyIDEiPgogICAgPGc+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI4OS43MSwxNzEuNjNjLTI5Ljg2LDAtNTguMTQsMTIuNzEtNzkuNTEsMzIuOCwxNzcuNDEsMTI5LjM5LDE3Ny40MS0xOTUsMC02NS42MSwyMS4zNywyMC4xLDQ5LjY1LDMyLjgxLDc5LjUxLDMyLjgxWiIvPgogICAgICA8cGF0aCBjbGFzcz0iY2xzLTIiIGQ9Ik0xNzEuODcsNTMuNzljMCwyOS43NSwxMi42MSw1Ny45MiwzMi41Nyw3OS4yNSwxMjkuNDQtMTc3LjQ5LTE5NS4zNi0xNzcuMzktNjUuNDIuMywyMC4xMi0yMS4zNywzMi44NS00OS42NiwzMi44NS03OS41NVoiLz4KICAgICAgPHBhdGggY2xhc3M9ImNscy0zIiBkPSJNMTcxLjg3LDI4OS40NmMwLTI5Ljg5LTEyLjczLTU4LjE4LTMyLjg1LTc5LjU1LTEyOS45NCwxNzcuNjksMTk0Ljg2LDE3Ny43OSw2NS40Mi4zLTE5Ljk2LDIxLjMzLTMyLjU3LDQ5LjUtMzIuNTcsNzkuMjVaIi8+CiAgICAgIDxwYXRoIGNsYXNzPSJjbHMtNSIgZD0iTTEzMy4zMywyMDQuMjNjLTIxLjM1LTE5Ljk4LTQ5LjUzLTMyLjYtNzkuMy0zMi42LDI5Ljc3LDAsNTcuOTUtMTIuNjMsNzkuMy0zMi42MS0xNzcuNzgtMTMwLTE3Ny43OCwxOTUuMjEsMCw2NS4yMVoiLz4KICAgIDwvZz4KICAgIDxwYXRoIGNsYXNzPSJjbHMtNCIgZD0iTTE3MS42MywyOTQuMjVjMC0xNi45Ni0zLjI3LTMyLjktOS44MS00Ny44Mi02LjMzLTE0LjkyLTE1LjAyLTI3LjktMjYuMDYtMzguOTMtMTEuMDQtMTEuMDQtMjQuMDEtMTkuNzItMzguOTMtMjYuMDYtMTQuOTItNi41NC0zMC44Ni05LjgxLTQ3LjgyLTkuODEsMTYuOTYsMCwzMi45LTMuMTcsNDcuODItOS41LDE0LjkyLTYuNTQsMjcuOS0xNS4zMywzOC45My0yNi4zNiwxMS4wNC0xMS4wNCwxOS43Mi0yNC4wMSwyNi4wNi0zOC45Myw2LjU0LTE0LjkyLDkuODEtMzAuODYsOS44MS00Ny44MiwwLDE2Ljk2LDMuMTcsMzIuOSw5LjUsNDcuODIsNi41NCwxNC45MiwxNS4zMywyNy45LDI2LjM2LDM4LjkzLDExLjA0LDExLjA0LDI0LjAxLDE5LjgyLDM4LjkzLDI2LjM2LDE0LjkyLDYuMzMsMzAuODYsOS41LDQ3LjgyLDkuNS0xNi45NiwwLTMyLjksMy4yNy00Ny44Miw5LjgxLTE0LjkyLDYuMzMtMjcuOSwxNS4wMi0zOC45MywyNi4wNi0xMS4wNCwxMS4wNC0xOS44MiwyNC4wMS0yNi4zNiwzOC45My02LjMzLDE0LjkyLTkuNSwzMC44Ni05LjUsNDcuODJaIi8+CiAgPC9nPgo8L3N2Zz4="; // Replace with your image path
  img.alt = "Summarize";

  button.appendChild(img);

  return button;
}

function styleStickyButton(button) {
  button.style.position = "fixed";
  button.style.bottom = "20px";
  button.style.right = "20px";
  button.style.width = "50px";
  button.style.height = "50px";
  button.style.borderRadius = "50%";
  button.style.backgroundColor = "white";
  button.style.boxShadow = "0 0 20px rgba(0, 0, 0, 0.9)";
  button.style.padding = "5px";
  button.style.border = "1px solid currentColor";
  button.style.cursor = "pointer";
  button.style.display = "flex";
  button.style.alignItems = "center";
  button.style.justifyContent = "center";
  button.style.zIndex = "9999";
}
// Sticky Button style end
