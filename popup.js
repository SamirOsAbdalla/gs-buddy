async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });

    return tabs[0];
}

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();

    document.getElementsByClassName("remove-button")[0].addEventListener("click", (event) => {
        chrome.history.search({ text: '', 'maxResults': 1000000000, startTime: 0 }, function (data) {
            chrome.tabs.sendMessage(activeTab.id, {
                type: "CLEARCLICK",
                data,
            })
        });
    })

    document.getElementsByClassName("color-input")[0].addEventListener("change", (event) => {
        let chosenColor = event.target.value
        chrome.history.search({ text: '', 'maxResults': 1000000000, startTime: 0 }, function (data) {
            chrome.tabs.sendMessage(activeTab.id, {
                type: "COLORCHANGE",
                data,
                chosenColor
            })
        });

    })
})
