function processChildNodes(childNodes, dataArray, type) {
    let returnedNodes = []

    childNodes.forEach(childNode => {
        let currentNode = childNode
        while (currentNode && currentNode.tagName != "A") {
            currentNode = currentNode.firstChild
        }

        if (currentNode) {
            if (dataArray.find(dataNode => {
                return dataNode.url == currentNode.href || dataNode.title == currentNode.text
            })) {
                if (type == "CLEARCLICK") {
                    returnedNodes.push(childNode)
                    return
                }

                returnedNodes.push(currentNode)
            }
        }
    })

    return returnedNodes
}

chrome.runtime.onMessage.addListener((obj, sender, response) => {

    const { type, data } = obj

    let searchNodesContainerList = document.querySelectorAll("[data-async-context]")
    let chosenColor = obj.chosenColor

    searchNodesContainerList.forEach(node => {
        if (node.getAttribute("data-async-context").includes("query:")) {
            let returnedNodes = processChildNodes(node.childNodes, data, type)

            if (type == "CLEARCLICK") {
                returnedNodes.forEach(returnedNode => { node.remove(returnedNode) })
                return
            }
            returnedNodes.forEach(returnedNode => { returnedNode.style.color = chosenColor })
        }
    })

    if (type == "COLORCHANGE") {
        chrome.storage.local.set({ "chosenColor": chosenColor })
    }

})