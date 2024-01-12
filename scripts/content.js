// need this variable so mutation observer has access to history
let previousHistoryItemsArray = []
let autoClearStatus = false
initializeObserver()

function processNormalNode({
    jscNode,
    historyItemsArray,
    type,
    parentNode,
    childNode
}) {
    let visitedLink = jscNode
    while (visitedLink && visitedLink.tagName != "A") {
        visitedLink = visitedLink.firstChild
    }

    if (!visitedLink || !historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, visitedLink))) {
        return undefined
    }

    if (type == "CLEARCLICK") {
        return childNode
    }

    //not a CLEARCLICK means we only need to worry about the individual link
    return visitedLink
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
    parentNode,
    childNode
}) {
    let questionsContainer = jscNode.firstChild.childNodes[1]
    if (!questionsContainer) {
        return
    }

    let numVisitedChildren = 0
    let totalValidChildren = 0
    let visitedLinks = []
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
            visitedLinks.push(link)
            return
        }

        numVisitedChildren += 1
        visitedLinks.push(questionContainer)
    })

    if (numVisitedChildren > 0 && numVisitedChildren == totalValidChildren) {
        visitedLinks.push(childNode)
    }

    return visitedLinks
}

function processTable(historyItemsArray) {
    //handle possible table
    let table = document.getElementsByTagName("table")
    let visitedLinks = []
    let allChildrenVisited = false
    let visitedCount = 0
    if (table) {
        let rows = table[0].rows
        for (let i = 0; i < rows.length; i++) {
            if (i == 0) {
                continue
            }

            let link = rows[i]
            while (link && link.tagName != "A") {
                link = link.firstChild
            }
            if (!link) {
                continue
            }

            if (historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, link))) {
                visitedCount += 1
                visitedLinks.push(rows[i])
            }
        }

        allChildrenVisited = (visitedCount == rows.length - 1)
        if (!allChildrenVisited) {
            return visitedLinks
        }
        //now check for the main link to see if we remove entire block or just the table links
        let baseLink = table[0].parentNode.firstChild
        while (baseLink && baseLink.tagName != "A") {
            baseLink = baseLink.firstChild
        }
        if (!baseLink) {
            return visitedLinks
        }
        if (historyItemsArray.find((dataNode) => foundHistoryItem(dataNode, baseLink))) {
            return [table[0].parentElement.parentElement.parentElement]
        }
    }

    return visitedLinks
}

function handleOutliers(parentNode, childNodes, historyItemsArray) {

    let returnLinks = []
    {
        let allVisitedNode = parentNode.childNodes[0]
        let visitedLinks = handleImagesNode(historyItemsArray, allVisitedNode)
        visitedLinks?.forEach(visitedLink => {
            returnLinks.push(visitedLink)
        })
    }
    {
        let visitedLinks = processTable(historyItemsArray)
        visitedLinks.forEach(visitedLink => {
            returnLinks.push(visitedLink)
        })
    }
    return returnLinks
}

function processChildNodes(parentNode, childNodes, historyItemsArray, type) {
    let returnedNodes = []

    let outlierVisitedLinks = handleOutliers(parentNode, childNodes, historyItemsArray)
    outlierVisitedLinks.forEach(link => {
        returnedNodes.push(link)
    })


    childNodes.forEach(childNode => {
        let jscNode = findNodeWithJSCAtrr(childNode)
        if (!jscNode) {
            return
        }
        let sublinkContainer = getSublinkContainer(jscNode)
        if (sublinkContainer) {
            let visitedLinks = processSublinkContainer({
                jscNode,
                sublinkContainer,
                historyItemsArray,
                type,
                parentNode,
                childNode
            })

            visitedLinks?.forEach(visitedLink => {
                returnedNodes.push(visitedLink)
            })
            return
        }

        let isAskNode = jscNode.getAttribute("data-initq")
        if (isAskNode) {
            let visitedLinks = processAskNode({
                jscNode,
                historyItemsArray,
                type,
                parentNode,
                childNode
            })
            visitedLinks?.forEach(visitedLink => {
                returnedNodes.push(visitedLink)
            })
            return
        }
        else {

            let visitedLink = processNormalNode({
                jscNode,
                historyItemsArray,
                type,
                parentNode,
                childNode
            })

            if (visitedLink) {
                returnedNodes.push(visitedLink)
            }
        }


    })
    return returnedNodes
}


chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, historyItemsArray, chosenColor } = obj

    previousHistoryItemsArray = historyItemsArray
    if (type == "AUTOCLEARTRUE" || type == "AUTOCLEARFALSE") {
        autoClearStatus = (type == "AUTOCLEARTRUE" ? true : false)
        return
    }

    previousHistoryItemsArray = historyItemsArray
    if (type == "CLEARCLICK") {
        let searchNodesContainerList = document.querySelectorAll("[data-async-context]")
        searchNodesContainerList.forEach(node => {
            if (node.getAttribute("data-async-context").includes("query:")) {
                let returnedNodes = processChildNodes(node, node.childNodes, historyItemsArray, type)
                deleteNodes(returnedNodes)
                return
            }
        })
    } else {
        let allLinks = document.getElementsByTagName("a")
        let returnedNodes = []
        for (let i = 0; i < allLinks.length; i++) {
            let link = allLinks[i]
            if (historyItemsArray.find(historyItem => foundHistoryItem(historyItem, link))) {
                returnedNodes.push(link)
            }
        }
        setNodeColors(returnedNodes, chosenColor)
    }

    if (type == "COLORCHANGE") {
        chrome.storage.local.set({ "chosenColor": chosenColor })
    }

})