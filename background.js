const extensionURL = 'https://www.google.com/search';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.url.startsWith(extensionURL)) {
        chrome.storage.local.get("chosenColor", ({ chosenColor }) => {
            chrome.history.search({ text: '', 'maxResults': 1000000000, startTime: 0 }, function (data) {
                chrome.tabs.sendMessage(tabId, {
                    type: "SETCOLOR",
                    data,
                    chosenColor
                })
            });

        })
    }
})

// // When the user clicks on the extension action
// chrome.action.onClicked.addListener(async (tab) => {
//     if (tab.url.startsWith(extensions)) {

//         // We retrieve the action badge to check if the extension is 'ON' or 'OFF'
//         const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
//         // Next state will always be the opposite
//         const nextState = prevState === 'ON' ? 'OFF' : 'ON';

//         // Set the action badge to the next state
//         await chrome.action.setBadgeText({
//             tabId: tab.id,
//             text: nextState
//         });

//         if (nextState == "ON") {
//             chrome.history.search({ text: '', 'maxResults': 1000000000, startTime: 0 }, function (data) {
//                 chrome.tabs.sendMessage(tab.id, {
//                     type: "ON",
//                     data
//                 })
//             });
//         }
//     }
// });


