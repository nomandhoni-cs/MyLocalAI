export default defineBackground(() => {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

  chrome.tabs.onActivated.addListener((activeInfo) => {
    showSummary(activeInfo.tabId);
  });
  chrome.tabs.onUpdated.addListener(async (tabId) => {
    showSummary(tabId);
  });

  async function showSummary(tabId) {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url.startsWith('http')) {
      return;
    }
    const injection = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['injected.js']
    });
    console.log(injection)
    chrome.storage.session.set({ pageContent: injection[0].result });
  }
  console.log('Hello background!', { id: browser.runtime.id });
});
