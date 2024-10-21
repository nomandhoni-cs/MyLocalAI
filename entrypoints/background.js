export default defineBackground(() => {
  // chrome.sidePanel
  //   .setPanelBehavior({ openPanelOnActionClick: true })
  //   .catch((error) => console.error(error));

  // chrome.tabs.onActivated.addListener((activeInfo) => {
  //   showSummary(activeInfo.tabId);
  // });
  // chrome.tabs.onUpdated.addListener(async (tabId) => {
  //   showSummary(tabId);
  // });

  async function showSummary(tabId) {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url.startsWith('http')) {
      return;
    }
    const injection = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['injected.js']
    });
    // console.log(injection)
    chrome.storage.session.set({ pageContent: injection[0].result });
  }
  console.log('Hello background!', { id: browser.runtime.id });

  // Context menu start
  chrome.contextMenus.create({
    id: 'summarize_this_selection',
    title: 'Summarize this selection',
    contexts: ['selection']
  });
  chrome.contextMenus.create({
    id: 'summarize_this_page',
    title: 'Summarize this page',
    contexts: ['page']
  });
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'summarize_this_selection') {
      chrome.sidePanel.open({ tabId: tab.id });
      chrome.storage.session.set({ pageContent: data.selectionText });
      // Make sure the side panel is open.
    }
    if (info.menuItemId === 'summarize_this_page') {
      chrome.sidePanel.open({ tabId: tab.id });
      showSummary(tab.id);

    }
  });
  // Context menu end
});
