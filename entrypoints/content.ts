import DOMPurify from "dompurify";

export default defineContentScript({
  matches: ["https://*/*"],
  main() {
    addStickyButton();
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
    // Sticky Button functionality
    function addStickyButton() {
      // Create the sticky button
      const stickyButton = document.createElement('button');
    
      // Set an image as the button content (use your own image URL or data URI)
      const img = document.createElement('img');
      img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAHESURBVHgBjVNNMgNREO5vxE+VhbmBbP1VcQJxgziA5NkwVuIE4QSRlbCacAC5QY5glGCZcYNYKKu89vUwaihEL+Z1Xnd/+frrfpBv1hi68PVFr1V0HSIjnu2L1atT+cWC7xcsboloJVDpiiKBoBXducpvALBPlgCtm+9Fq4Gg11nt7robF85M+yGTUgIlSkaYQruzFKefDKL7WlPh+16kqpAKgJEX3Fow3ohHBEsECC1GZg0d+3706Mo5QElVHKn2Lta62z9RJJOt3LdCP/Y3MvYNkyvXoAzRW/mHGXWAbQgWPluwjwKbRVqTjO2s58KyRaSmOnsbHjy46qRiKFK2XTbd9gY7jWwKpvbstPbpjs4LPf9l0aDet13JWjC1RSXlmEL5pzE35RGWorvaMTVY5FWVdNqTCt9pB5bvKGZcoiBNWxBu3kln7fJ4EgD35JAahBQvnpvHUckuA9V2sXiPy0V0JwYMnJwtx70iCPvONvXD/2r7g3oLKgaWsNHQe39dfAv27xTvOf+dMcj2gFqYz7fgjF5nJX8LOuTsmoxXLI/ZIRAkXwCyPch2/eN1qT7ZYdPZv69xQu9x04rBo/OVOM4B3gCn4dLeryIYgQAAAABJRU5ErkJggg=='; // Replace with your image path
      img.alt = 'Summarize';
      img.style.width = '24px';
      img.style.height = '24px';
      stickyButton.appendChild(img);
    
      // Make the button round and position it fixed at the bottom-right
      stickyButton.style.position = 'fixed';
      stickyButton.style.bottom = '20px';
      stickyButton.style.right = '20px';
      stickyButton.style.width = '40px';
      stickyButton.style.height = '40px';
      stickyButton.style.borderRadius = '50%';
      stickyButton.style.border = 'none';
      stickyButton.style.cursor = 'pointer';
      stickyButton.style.display = 'flex';
      stickyButton.style.alignItems = 'center';
      stickyButton.style.justifyContent = 'center';
      stickyButton.style.zIndex = '9999'; // Ensure it's above other elements
    
      // Add click event for the sticky button
      stickyButton.onclick = function () {
        alert('Sticky button clicked!');
      };
    
      // Append the sticky button to the body
      document.body.appendChild(stickyButton);
    
      // Change the button's background color based on article readability
      updateButtonBackground(stickyButton);
    }
    
    // Function to update the background color based on article readability
    function updateButtonBackground(button) {
      // This assumes you have `injected.js` to check if the article is readable
      import('@mozilla/readability').then(({ isProbablyReaderable }) => {
        const isReadable = isProbablyReaderable(document, { minContentLength: 100 });
        if (isReadable) {
          button.style.backgroundColor = 'green'; // Set background to green if readable
        } else {
          button.style.backgroundColor = 'white'; // Set background to white if not readable
        }
      });
    }
    
    
  },
  
});


