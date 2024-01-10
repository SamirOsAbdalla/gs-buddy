function foundHistoryItem(dataNode, visitedLink) {
    return (dataNode.url == visitedLink.href || dataNode.title == visitedLink.text)
}


//JSC = jscontroller
function findJSCAttribute(childNodes) {
    for (let childNode of childNodes) {
        if (childNode.getAttribute && childNode.getAttribute("jscontroller")) {
            return childNode
        }
    }
    return undefined
}


function findNodeWithJSCAtrr(currentNode) {
    //Two Scenarios
    //1. One of the child nodes has jscontroller attribute
    //2. One of the child nodes of the first child node has jscontroller attribute

    if (!currentNode || !currentNode.childNodes) {
        return
    }
    let returnNode = findJSCAttribute(currentNode.childNodes)
    if (returnNode) {
        return returnNode
    }

    let firstChild = currentNode.firstChild
    if (!firstChild || !firstChild.childNodes) {
        return
    }

    return findJSCAttribute(firstChild.childNodes)
}

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
    returnedNodes,
    parentNode,
    childNode
}) {
    let bigLinkContainer = jscNode.firstChild.firstChild

    let visitedSublinks = []
    let visitedAllSublinks = processSublinks(sublinkContainer, historyItemsArray, type, visitedSublinks)
    let bigLink = processBigLinkContainer(bigLinkContainer, historyItemsArray)

    if (type != "CLEARCLICK") {
        visitedSublinks.forEach(visitedSublink => {
            returnedNodes.push(visitedSublink)
        })

        if (bigLink) {
            returnedNodes.push(bigLink)
        }
        return
    }

    if (!visitedAllSublinks || !bigLink) {
        visitedSublinks.forEach(visitedSublink => {
            returnedNodes.push(visitedSublink)
        })
        return
    }

    if (bigLink) {
        returnedNodes.push({ parentNode, childNode })
    }
}

function processBigLinkContainer(bigLinkContainer, historyItemsArray) {

    let bigLink = bigLinkContainer
    while (bigLink.tagName != "A") {
        bigLink = bigLink.firstChild
    }

    if (historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, bigLink))) {
        return bigLink
    }

    return undefined
}

function processSublinks(sublinkContainer, historyItemsArray, type, visitedSublinks) {
    //handle sublinks
    let sublinkNodes = sublinkContainer.childNodes
    let pushCount = 0
    for (let childNode of sublinkNodes) {
        let link = childNode.firstChild.firstChild.firstChild
        if (!historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, link))) {
            continue
        }

        if (type == "CLEARCLICK") {
            pushCount += 1
            visitedSublinks.push({ parentNode: sublinkContainer, childNode })
        } else {
            visitedSublinks.push(link)
        }
    }

    return pushCount == sublinkNodes.length || pushCount == sublinkNodes.length - 1
}


function processNormalNode({
    jscNode,
    historyItemsArray,
    type,
    returnedNodes,
    parentNode,
    childNode
}) {
    let visitedLink = jscNode
    while (visitedLink && visitedLink.tagName != "A") {
        visitedLink = visitedLink.firstChild
    }
    if (!visitedLink || !historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, visitedLink))) {
        return
    }

    if (type == "CLEARCLICK") {
        returnedNodes.push({ parentNode, childNode })
        return
    }

    //not a CLEARCLICK means we only need to worry about the individual link
    returnedNodes.push(visitedLink)
}

//ASKNODE structure
//People also ask
// Q1
// ...
// Qn
function processAskNode({
    jscNode,
    historyItemsArray,
    type,
    returnedNodes,
    parentNode,
    childNode
}) {
    let questionsContainer = jscNode.firstChild.childNodes[1]
    if (!questionsContainer) {
        return
    }

    let numVisitedChildren = 0
    let totalValidChildren = 0
    let visitedChildren = []
    questionsContainer.childNodes.forEach(questionContainer => {
        if (questionContainer.tagName != "DIV" || !questionContainer.firstChild) {
            return
        }

        totalValidChildren += 1
        //this is the first node where we can just iteratively while loop the first child of the current node
        let nodeListChildNodes = questionContainer.firstChild.firstChild.firstChild.childNodes[2].firstChild.firstChild.childNodes

        //its still a div but after the while loop it will be a link
        let link = nodeListChildNodes[nodeListChildNodes.length - 1]

        while (link && link.tagName != "A") {
            link = link.firstChild
        }
        if (!link || !historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, link))) {
            return
        }

        if (type != "CLEARCLICK") {
            returnedNodes.push(link)
            return
        }

        numVisitedChildren += 1
        visitedChildren.push({ parentNode: questionsContainer, childNode: questionContainer })

    })

    if (numVisitedChildren > 0 && numVisitedChildren == totalValidChildren) {
        returnedNodes.push({ parentNode, childNode })
    } else {
        visitedChildren.forEach(visitedChild => {
            returnedNodes.push(visitedChild)
        })
    }
}

function processChildNodes(parentNode, childNodes, historyItemsArray, type) {
    let returnedNodes = []

    childNodes.forEach(childNode => {
        let jscNode = findNodeWithJSCAtrr(childNode)
        if (!jscNode) {
            return
        }

        let sublinkContainer = getSublinkContainer(jscNode)
        if (sublinkContainer) {
            processSublinkContainer({
                jscNode,
                sublinkContainer,
                historyItemsArray,
                type,
                returnedNodes,
                parentNode,
                childNode
            })

            return
        }

        let isAskNode = jscNode.getAttribute("data-initq")
        if (isAskNode) {
            processAskNode({
                jscNode,
                historyItemsArray,
                type,
                returnedNodes,
                parentNode,
                childNode
            })
        }
        else {
            processNormalNode({
                jscNode,
                historyItemsArray,
                type,
                returnedNodes,
                parentNode,
                childNode
            })
        }


    })
    return returnedNodes
}


function deleteNodes(returnedNodes) {
    returnedNodes.forEach(({ parentNode, childNode }) => {
        parentNode.removeChild(childNode)
    })
}

function setNodeColors(returnedNodes, chosenColor) {
    returnedNodes.forEach(returnedNode => { returnedNode.style.color = chosenColor })
}

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, data, chosenColor } = obj
    let searchNodesContainerList = document.querySelectorAll("[data-async-context]")

    searchNodesContainerList.forEach(node => {
        if (node.getAttribute("data-async-context").includes("query:")) {
            let returnedNodes = processChildNodes(node, node.childNodes, data, type)
            if (type == "CLEARCLICK") {
                deleteNodes(returnedNodes)
                return
            }
            setNodeColors(returnedNodes, chosenColor)
        }
    })

    if (type == "COLORCHANGE") {
        chrome.storage.local.set({ "chosenColor": chosenColor })
    }

})