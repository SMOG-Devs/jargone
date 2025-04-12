// TEST
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "add-youtube-bookmark",
    title: "dupa",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.youtube.com/watch*"]
  });
});
// TEST

chrome.tabs.onUpdated.addListener((tabId, tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);

    chrome.tabs.sendMessage(tabId, {
      type: "NEW",
      videoId: urlParameters.get("v"),
    });
  }
});

// TEST
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "add-youtube-bookmark" 
    && tab.url 
    && tab.url.includes("youtube.com/watch")
  ) {
    const queryParameters = tab.url.split("?")[1];
    const urlParameters = new URLSearchParams(queryParameters);
    
    chrome.tabs.sendMessage(tab.id, {
      type: "DUPA",
      videoId: urlParameters.get("v"),
    });
  }
});
// TEST