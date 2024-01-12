const extensionURL = 'https://www.google.com/search';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!tab.url.startsWith(extensionURL)) {
        return
    }

    chrome.storage.local.get("chosenColor", ({ chosenColor }) => {
        chrome.history.search({ text: '', 'maxResults': 1000000000, startTime: 0 }, function (data) {
            chrome.tabs.sendMessage(tabId, {
                type: "SETCOLOR",
                historyItemsArray: data,
                chosenColor
            })
        });

    })
})

