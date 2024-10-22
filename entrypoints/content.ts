import DOMPurify from "dompurify";
import { isProbablyReaderable, Readability } from '@mozilla/readability';

let isSummaryDisplayed = false
const summaryOptions = {
  type: ["key-points", "tl;dr", "teaser", "headline"] as AISummarizerType[],
  length: ["short", "medium", "long"] as AISummarizerLength[],
  format: ["markdown", "plain-text"] as AISummarizerFormat[]
};

// Document Parsing start 
function canBeParsed(document: Document) {
  return isProbablyReaderable(document, {
    minContentLength: 100
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
      const summary = await summarizeText(textHaveToBeSummarized);
      if(isSummaryDisplayed){
        const summaryDiv = document.querySelector('#summarized_text_div');
        summaryDiv.remove();
        isSummaryDisplayed = !isSummaryDisplayed
      }
      else{
        createSummaryElement(summary);
        isSummaryDisplayed = !isSummaryDisplayed
      }
    } else {
      alert("This page cannot be summarized.");
    }
  };
  
  document.body.appendChild(button);
}

// Create the summary element
function createSummaryElement(summary: string) {
  const summaryDiv = document.createElement('div');
  summaryDiv.setAttribute("id","summarized_text_div")
  summaryDiv.innerHTML = `
  <div style="position: fixed; bottom: 8%; right: 5%; width: 300px; padding: 20px; background-color: white; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1); z-index: 1000;">
  <div style="position: relative;">
  <button id="close-summary" style="position: absolute; top: 0; right: 0; background: none; border: none; font-size: 16px; cursor: pointer;">✕</button>
  <h3>Summary</h3>
  <p>${summary}</p>
  </div>
  </div>
  `;

  document.body.appendChild(summaryDiv);
  
  // Close button functionality
  const closeButton = summaryDiv.querySelector('#close-summary');
  closeButton?.addEventListener('click', () => {
    summaryDiv.remove();
    isSummaryDisplayed = !isSummaryDisplayed
  });
}

// Summarize text using the AI Summarizer API
async function summarizeText(text: string): Promise<string> {
  try {
    const summarizationSession = await createSummarizationSession(
      summaryOptions.type[0],    // 'key-points'
      summaryOptions.format[0],  // 'markdown'
      summaryOptions.length[1]   // 'medium'
    );
    
    const summary = await summarizationSession.summarize(text);
    summarizationSession.destroy();  // Clean up the session
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
  if (canSummarize.available === 'no') {
    throw new Error('AI Summarization is not supported');
  }

  const summarizationSession = await window.ai.summarizer!.create({ type, format, length });
  if (canSummarize.available === 'after-download') {
    if (downloadProgressCallback) {
      summarizationSession.addEventListener('downloadprogress', downloadProgressCallback);
    }
    await summarizationSession.ready;
  }

  return summarizationSession;
}



// Write and Rewrite start
let btnContainer = createButtonContainer();

function onFocusIn(event) {
  const el = event.target;
  if (el.contentEditable && el.matches('input, textarea') && el.type.match(/email|number|search|text|url/)) {
    appendButton(el);
  }
}

function appendButton(textElement) {
  // Remove existing button container if it exists
  const existingContainer = document.querySelector('.ai-button-container');
  if (existingContainer) existingContainer.remove();

  const parentElement = textElement.parentElement;
  parentElement.style.position = 'relative';

  btnContainer.className = 'ai-button-container';
  btnContainer.style.position = 'absolute';
  btnContainer.style.top = '2%';
  btnContainer.style.right = '2%';
  btnContainer.style.zIndex = '9999';

  parentElement.insertBefore(btnContainer, textElement.nextElementSibling);
}

function createButtonContainer() {
  // Create a container for both Write and Rewrite buttons
  const container = document.createElement('div');
  container.style.display = 'inline-flex';
  container.style.gap = '10px'; // Gap between buttons

  // Create Write button
  const writeButton = document.createElement('button');
  writeButton.textContent = 'Write';
  writeButton.style.padding = '5px';
  writeButton.onclick = async (event) => {
    event.preventDefault();
    await handleWrite();
  };
  container.appendChild(writeButton);

  // Create Rewrite button
  const rewriteButton = document.createElement('button');
  rewriteButton.textContent = 'Rewrite';
  rewriteButton.style.padding = '5px';
  rewriteButton.onclick = async (event) => {
    event.preventDefault();
    await handleRewrite();
  };
  container.appendChild(rewriteButton);

  return container;
}

async function handleWrite() {
  const userInput = prompt('Enter text to write:');
  if (!userInput) return;

  // Call the AI writer API and get the response (mocked here)
  const aiResponse = await self.ai.writer.create({
    tone: 'neutral', // You can adjust the tone, format, etc.
    length: 'medium',
    format: 'plain',
  }).writeStreaming(userInput);

  let fullResponse = '';
  for await (const chunk of aiResponse) {
    fullResponse += chunk.trim();
  }

  const focusedElement = document.activeElement;
  if (focusedElement.matches('input, textarea')) {
    focusedElement.value = fullResponse;
  } else if (focusedElement.contentEditable) {
    focusedElement.innerHTML = DOMPurify.sanitize(fullResponse);
  }
}

async function handleRewrite() {
  const focusedElement = document.activeElement;
  let currentText = '';

  if (focusedElement.matches('input, textarea')) {
    currentText = focusedElement.value;
  } else if (focusedElement.contentEditable) {
    currentText = focusedElement.innerText;
  }

  if (!currentText) return alert('No text found to rewrite.');

  // Call the AI rewriter API and get the response (mocked here)
  const aiResponse = await self.ai.rewriter.create({
    tone: 'neutral', // Adjust settings as necessary
    length: 'medium',
    format: 'plain',
  }).rewriteStreaming(currentText);

  let fullResponse = '';
  for await (const chunk of aiResponse) {
    fullResponse += chunk.trim();
  }

  if (focusedElement.matches('input, textarea')) {
    focusedElement.value = fullResponse;
  } else if (focusedElement.contentEditable) {
    focusedElement.innerHTML = DOMPurify.sanitize(fullResponse);
  }
}
// Write and Rewrite end
export default defineContentScript({
  matches: ["https://*/*"],
  main() {
    const isReadable = canBeParsed(window.document)
    console.log(isReadable)
    if (isReadable ){
      addStickyButton();
    }
    document.addEventListener('focusin', onFocusIn);

    console.log('Content script initialized.');
  },
  
});

// Style Section start 
// Sticky Button style start 
function createStickyButton() {
  const button = document.createElement('button');
  
  const img = document.createElement('img');
  img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHESURBVHgBjVNNMgNREO5vxE+VhbmBbP1VcQJxgziA5NkwVuIE4QSRlbCacAC5QY5glGCZcYNYKKu89vUwaihEL+Z1Xnd/+frrfpBv1hi68PVFr1V0HSIjnu2L1atT+cWC7xcsboloJVDpiiKBoBXducpvALBPlgCtm+9Fq4Gg11nt7robF85M+yGTUgIlSkaYQruzFKefDKL7WlPh+16kqpAKgJEX3Fow3ohHBEsECC1GZg0d+3706Mo5QElVHKn2Lta62z9RJJOt3LdCP/Y3MvYNkyvXoAzRW/mHGXWAbQgWPluwjwKbRVqTjO2s58KyRaSmOnsbHjy46qRiKFK2XTbd9gY7jWwKpvbstPbpjs4LPf9l0aDet13JWjC1RSXlmEL5pzE35RGWorvaMTVY5FWVdNqTCt9pB5bvKGZcoiBNWxBu3kln7fJ4EgD35JAahBQvnpvHUckuA9V2sXiPy0V0JwYMnJwtx70iCPvONvXD/2r7g3oLKgaWsNHQe39dfAv27xTvOf+dMcj2gFqYz7fgjF5nJX8LOuTsmoxXLI/ZIRAkXwCyPch2/eN1qT7ZYdPZv69xQu9x04rBo/OVOM4B3gCn4dLeryIYgQAAAABJRU5ErkJggg=='; // Replace with your image path
  img.alt = 'Summarize';

  button.appendChild(img);
  
  return button;
}

function styleStickyButton(button) {
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.width = '30px';
  button.style.height = '30px';
  button.style.borderRadius = '50%';
  button.style.border = 'none';
  button.style.cursor = 'pointer';
  button.style.display = 'flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.zIndex = '9999';
}
// Sticky Button style end