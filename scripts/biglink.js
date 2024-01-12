//BIG LINK STRUCTURE
//BIG LINK
// sublink1
// sublink2
// .....
// more results
function getSublinkContainer(currentNode) {
    let iteratedNode = currentNode.firstChild

    if (!iteratedNode) {
        return undefined
    }

    let childNodes = iteratedNode.childNodes

    for (let childNode of childNodes) {
        let firstChild = childNode.firstChild
        if (firstChild && firstChild.getAttribute && firstChild.getAttribute("data-ved")) {
            if (firstChild.getAttribute("role") == "button") {
                continue
            }
            return firstChild.firstChild
        }
    }
    return undefined
}

function processSublinkContainer({
    sublinkContainer,
    jscNode,
    historyItemsArray,
    type,
    parentNode,
    childNode
}) {
    let bigLinkContainer = jscNode.firstChild.firstChild

    let { visitedSublinks, visitedAllSublinks } = processSublinks(sublinkContainer, historyItemsArray, type)
    let bigLink = processBigLinkContainer(bigLinkContainer, historyItemsArray)

    if (type != "CLEARCLICK") {
        if (bigLink) {
            visitedSublinks.push(bigLink)
        }
        return visitedSublinks
    }

    if (!visitedAllSublinks || !bigLink) {
        return visitedSublinks
    }

    if (bigLink) {
        return [childNode]
    }
}

function processBigLinkContainer(bigLinkContainer, historyItemsArray) {

    let bigLink = bigLinkContainer
    while (bigLink && bigLink.tagName != "A") {
        bigLink = bigLink.firstChild
    }

    if (!bigLink) {
        return undefined
    }
    if (historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, bigLink))) {
        return bigLink
    }

    return undefined
}

function processSublinks(sublinkContainer, historyItemsArray, type) {

    let sublinkNodes = sublinkContainer.childNodes
    let pushCount = 0
    let visitedSublinks = []
    for (let childNode of sublinkNodes) {
        let link = childNode.firstChild.firstChild.firstChild
        if (!historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, link))) {
            continue
        }

        if (type == "CLEARCLICK") {
            pushCount += 1
            visitedSublinks.push(childNode)
        } else {
            visitedSublinks.push(link)
        }
    }

    return ({
        visitedSublinks,
        visitedAllSublinks: pushCount == sublinkNodes.length || pushCount == sublinkNodes.length - 1
    })
}
