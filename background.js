const extensionURL = 'https://www.google.com/search';
async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });

    return tabs[0];
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!tab.url.startsWith(extensionURL)) {
        return
    }

    chrome.storage.local.get("autoClear", ({ autoClear }) => {
        chrome.history.search({ text: '', 'maxResults': 1000000000, startTime: 0 }, function (data) {
            if (autoClear) {
                chrome.tabs.sendMessage(tabId, {
                    type: "AUTOCLEARTRUE",
                    historyItems: data,
                    undefined
                })
            } else {
                chrome.storage.local.get("chosenColor", ({ chosenColor }) => {
                    chrome.tabs.sendMessage(tabId, {
                        type: "SETCOLOR",
                        historyItems: data,
                        chosenColor,
                    })
                })
            }
        });
    })
})

chrome.history.onVisited.addListener(function (historyItem) {
    chrome.storage.local.get("autoClear", async ({ autoClear }) => {
        let activeTab = await getActiveTabURL()
        let tabId = activeTab.id
        chrome.history.search({ text: '', 'maxResults': 1000000000, startTime: 0 }, function (data) {
            if (autoClear) {
                chrome.tabs.sendMessage(tabId, {
                    type: "AUTOCLEARTRUE",
                    historyItems: data,
                    undefined
                })
            } else {
                chrome.storage.local.get("chosenColor", ({ chosenColor }) => {
                    chrome.tabs.sendMessage(tabId, {
                        type: "SETCOLOR",
                        historyItems: data,
                        chosenColor,
                    })
                })
            }
        })
    })
});
