import DOMPurify from "dompurify";

export default defineContentScript({
  matches: ["https://*/*"],
  main() {
    let btnContainer = createButtonContainer();
    document.addEventListener('focusin', onFocusIn);

    function onFocusIn(event) {
      const el = event.target;
      if (el.contentEditable && el.matches('input, textarea') && el.type.match(/email|number|search|text|url/)) {
        appendButton(el);
      }
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

    function appendButton(textElement) {
      // Remove existing button container if it exists
      const existingContainer = document.querySelector('.ai-button-container');
      if (existingContainer) existingContainer.remove();

      // Set the parent element to relative to position the button absolutely
      const parentElement = textElement.parentElement;
      parentElement.style.position = 'relative';

      // Position the container of buttons
      btnContainer.className = 'ai-button-container';
      btnContainer.style.position = 'absolute';
      btnContainer.style.top = '2%';
      btnContainer.style.right = '2%';
      btnContainer.style.zIndex = '9999'; // Ensure it's above other elements

      // Append the button container to the parent
      parentElement.insertBefore(btnContainer, textElement.nextElementSibling);
    }

    console.log('Content script initialized.');
  },
});


