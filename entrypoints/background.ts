import { storage } from "wxt/storage";

// Define the Note interface
interface Note {
  id: string;
  text: string;
  tags: string[];
  selectedText: string;
  createdAt: number;
}

// Define a storage item for notes
const notesStorage = storage.defineItem<Note[]>("local:notes", {
  fallback: [],
});

export default defineBackground(() => {
  console.log("Background script initialized");
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  // chrome.tabs.onActivated.addListener((activeInfo) => {
  //   showSummary(activeInfo.tabId);
  // });
  // chrome.tabs.onUpdated.addListener(async (tabId) => {
  //   showSummary(tabId);
  // });

  // async function showSummary(tabId) {
  //   const tab = await chrome.tabs.get(tabId);
  //   if (!tab.url.startsWith("http")) {
  //     return;
  //   }
  //   const injection = await chrome.scripting.executeScript({
  //     target: { tabId },
  //     files: ["injected.js"],
  //   });
  //   // console.log(injection)
  //   chrome.storage.session.set({ pageContent: injection[0].result });
  // }
  // console.log("Hello background!", { id: browser.runtime.id });

  // Context menu start
  // chrome.contextMenus.create({
  //   id: "summarize_this_selection",
  //   title: "Summarize this selection",
  //   contexts: ["selection"],
  // });
  // chrome.contextMenus.create({
  //   id: "summarize_this_page",
  //   title: "Summarize this page",
  //   contexts: ["page"],
  // });
  chrome.contextMenus.create({
    id: "open_side_panel",
    title: "Open Side Panel",
    contexts: ["page"],
  });

  chrome.contextMenus.create({
    id: "save_this_selection",
    title: "Save this as Notes",
    contexts: ["selection"],
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    // if (info.menuItemId === "summarize_this_selection") {
    //   chrome.sidePanel.open({ tabId: tab.id });
    //   chrome.storage.session.set({ pageContent: data.selectionText });
    //   // Make sure the side panel is open.
    // }
    // if (info.menuItemId === "summarize_this_page") {
    //   chrome.sidePanel.open({ tabId: tab.id });
    //   showSummary(tab.id);
    // }
    if (info.menuItemId === "open_side_panel") {
      chrome.sidePanel.open({ tabId: tab.id });
    }

    if (info.menuItemId === "save_this_selection") {
      console.log("Save selection context menu clicked");
      console.log("Selected text:", info.selectionText);

      // Inject content script to handle prompt
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: (selectionText) => {
            // This runs in the page context
            const tagsInput = prompt(
              'Enter tags/topics (comma-separated, press Cancel for "general"):'
            );

            // Send message back to background script
            chrome.runtime.sendMessage({
              type: "SAVE_NOTE",
              payload: {
                selectionText: selectionText,
                tagsInput: tagsInput,
              },
            });
          },
          args: [info.selectionText],
        })
        .catch((err) => {
          console.error("Error injecting script:", err);
        });
    }
  });

  // Listener for saving the note
  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === "SAVE_NOTE") {
      console.log("Received save note message:", message);

      const { selectionText, tagsInput } = message.payload;

      // Process tags
      let tags: string[];
      if (tagsInput === null) {
        // User pressed Cancel
        tags = ["general"];
      } else {
        // Split and clean tags
        tags = tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);

        // Use 'general' if no tags provided
        if (tags.length === 0) {
          tags = ["general"];
        }
      }

      // Create a new note
      const newNote: Note = {
        id: Date.now().toString(),
        text: "", // Optional note text left empty
        tags: tags,
        selectedText: selectionText,
        createdAt: Date.now(),
      };

      try {
        // Get existing notes and add the new note
        const existingNotes = (await notesStorage.getValue()) || [];
        console.log(existingNotes, "retrieved from storage");
        await notesStorage.setValue([...existingNotes, newNote]);
        console.log(newNote, "added to storage");

        console.log("Note saved successfully:", newNote);
      } catch (error) {
        console.error("Error saving note:", error);
      }
    }
  });

  console.log("Background script setup complete");
});
