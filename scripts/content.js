// need this variable so mutation observer has access to history
let autoClearStatus = false
let previousHistoryItems;
initializeObserver()


function processNormalNode({
    jscNode,
    historyItems,
    type,
    parentNode,
    childNode
}) {
    let visitedLink = jscNode
    while (visitedLink && visitedLink.tagName != "A") {
        visitedLink = visitedLink.firstChild
    }

    if (!visitedLink || !foundHistoryItem(historyItems, visitedLink)) {
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
    historyItems,
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
        if (!link || !foundHistoryItem(historyItems, link)) {
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

function processChildNodes(parentNode, childNodes, historyItems, type) {
    let returnedNodes = []

    let outlierVisitedLinks = handleOutliers(parentNode, childNodes, historyItems)
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
                historyItems,
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
                historyItems,
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
                historyItems,
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
    let { type, historyItems, chosenColor } = obj

    previousHistoryItems = historyItems
    if (type == "AUTOCLEARTRUE" || type == "AUTOCLEARFALSE") {
        autoClearStatus = (type == "AUTOCLEARTRUE" ? true : false)
        if (type == "AUTOCLEARTRUE") {
            type = "CLEARCLICK"
        }
    }

    if (type == "CLEARCLICK") {
        let searchNodesContainerList = document.querySelectorAll("[data-async-context]")
        searchNodesContainerList.forEach(node => {
            if (node.getAttribute("data-async-context").includes("query:")) {
                let returnedNodes = processChildNodes(node, node.childNodes, historyItems, type)
                deleteNodes(returnedNodes)
                return
            }
        })
    } else {
        let allLinks = document.getElementsByTagName("a")
        let returnedNodes = []
        for (let i = 0; i < allLinks.length; i++) {
            let link = allLinks[i]
            if (foundHistoryItem(historyItems, link)) {
                returnedNodes.push(link)
            }
        }
        setNodeColors(returnedNodes, chosenColor)
    }

    if (type == "COLORCHANGE") {
        chrome.storage.local.set({ "chosenColor": chosenColor })
    }

})