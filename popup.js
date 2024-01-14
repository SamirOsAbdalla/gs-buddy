let defaultVisitedColor = "#681da8"

//duplicated code but chrome is a little funky regarding imports
//only one var but currently wary of accumulated code smell
const extensionURL = 'https://www.google.com/search';

const defaultHistorySearchObject = {
    text: '',
    'maxResults': 1000000000,
    startTime: 0
}


async function getActiveTabURL() {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });

    return tabs[0];
}

function sendMessageCB(tabId, type, data, chosenColor) {
    chrome.tabs.sendMessage(tabId, {
        type,
        historyItems: data,
        chosenColor
    })
}

function setInputColor(input) {
    chrome.storage.local.get("chosenColor", ({ chosenColor }) => {
        if (chosenColor) {
            input.value = chosenColor
        } else {
            input.value = defaultVisitedColor
        }
    })
}

function populateSavedColorDiv(tabId, childDiv, newColor) {
    childDiv.classList.add("saved-color")
    childDiv.style.backgroundColor = newColor

    childDiv.addEventListener("click", (event) => {
        let input = document.querySelector(".color-input")
        input.value = newColor

        chrome.history.search(
            defaultHistorySearchObject,
            (data) => sendMessageCB(tabId, "COLORCHANGE", data, newColor)
        )
    })
}

function appendSavedColors(savedColorsContainer, tabId) {
    chrome.storage.local.get("savedColors", ({ savedColors }) => {
        if (!savedColors) {
            return
        }

        savedColors.forEach(color => {
            let childDiv = document.createElement("div")
            populateSavedColorDiv(tabId, childDiv, color)
            savedColorsContainer.appendChild(childDiv)
        })
    })
}

function initializePopup(tabId) {
    let input = document.querySelector(".color-input")
    setInputColor(input)

    let savedColorsContainer = document.querySelector(".saved-colors__container")
    appendSavedColors(savedColorsContainer, tabId)

    let inputSlider = document.querySelector(".input-slider")
    chrome.storage.local.get("autoClear", ({ autoClear }) => {
        autoClear ? inputSlider.style.left = "52%" : inputSlider.style.left = "5%"
    })
}

document.addEventListener("DOMContentLoaded", async () => {
    const activeTab = await getActiveTabURL();
    let tabId = activeTab.id

    initializePopup(tabId)
    if (!activeTab.url.startsWith(extensionURL)) {
        return
    }

    document.getElementsByClassName("clear-button")[0].addEventListener("click", (event) => {
        chrome.history.search(
            defaultHistorySearchObject,
            (data) => sendMessageCB(tabId, "CLEARCLICK", data, undefined))
    })

    document.getElementsByClassName("reset-button")[0].addEventListener("click", (event) => {
        document.querySelector(".color-input").value = defaultVisitedColor
        chrome.history.search(
            defaultHistorySearchObject,
            (data) => sendMessageCB(tabId, "COLORCHANGE", data, defaultVisitedColor)
        )
    })

    document.getElementsByClassName("save-button")[0].addEventListener("click", (event) => {
        let childDiv = document.createElement("div")
        let input = document.querySelector(".color-input")
        let newColor = input.value
        populateSavedColorDiv(tabId, childDiv, newColor)

        let savedColorsContainer = document.querySelector(".saved-colors__container")
        savedColorsContainer.appendChild(childDiv)

        chrome.storage.local.get("savedColors", ({ savedColors }) => {
            let savedColorsArray = [];
            if (savedColors) {
                savedColorsArray = savedColors
            }

            savedColorsArray.push(newColor)
            chrome.storage.local.set({ "savedColors": savedColorsArray })
        })
    })

    document.getElementsByClassName("color-input")[0].addEventListener("change", (event) => {
        let chosenColor = event.target.value
        chrome.history.search(
            defaultHistorySearchObject,
            (data) => sendMessageCB(tabId, "COLORCHANGE", data, chosenColor)
        )
    })

    document.getElementsByClassName("checkbox-label")[0].addEventListener("click", (event) => {
        chrome.storage.local.get("autoClear", ({ autoClear }) => {
            let inputSlider = document.querySelector(".input-slider")

            let newStatus = !autoClear
            //do opposite
            newStatus ? inputSlider.style.left = "52%" : inputSlider.style.left = "5%"
            chrome.storage.local.set({ "autoClear": newStatus })


            //Need to send clear click and check for auto clear status at the same time
            chrome.tabs.sendMessage(tabId, {
                type: `AUTOCLEAR${newStatus.toString().toUpperCase()}`,
                historyItems: [],
                undefined
            })
        })
    })

})
