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
    //Three Scenarios
    //1. One of the child nodes has jscontroller attribute
    //2. One of the child nodes of the first child node has jscontroller attribute
    //3. The child node is a youtube video and now we find the jscontroller node with the data-surl attribute
    if (!currentNode || !currentNode.childNodes) {
        return undefined
    }

    //First scenario
    let returnNode = findJSCAttribute(currentNode.childNodes)
    if (returnNode) {
        return returnNode
    }

    //Second scenario
    let firstChild = currentNode.firstChild
    if (!firstChild || !firstChild.childNodes) {
        return undefined
    }

    returnNode = findJSCAttribute(firstChild.childNodes)
    if (returnNode) {
        return returnNode
    }

    //Third Scenario
    while (firstChild && firstChild.getAttribute) {
        if (firstChild.getAttribute("data-surl")?.startsWith("https://www.youtube.com")) {
            return firstChild
        }
        firstChild = firstChild.firstChild
    }

    return undefined

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


//This is the div with a bunch of images in it
function processImagesWrapper(imagesWrapper, historyItemsArray) {

    let visitedLinks = []
    let visitedCount = 0
    imagesWrapper.childNodes.forEach(container => {

        let hasJsAttribute = container.getAttribute("jsname")
        let imageContainer = hasJsAttribute ? container : container.firstChild
        let link = imageContainer.childNodes[1].firstChild
        if (link.tagName != "A" || !historyItemsArray.find(dataNode => foundHistoryItem(dataNode, link))) {
            return
        }

        visitedCount += 1
        if (hasJsAttribute) {
            visitedLinks.push(container)
        } else {
            visitedLinks.push(imageContainer)
        }

    })

    return {
        visitedLinks,
        allChildrenVisited: visitedCount > 0 && visitedCount == imagesWrapper.childNodes.length
    }
}


function processChildNodes(parentNode, childNodes, historyItemsArray, type) {
    let returnedNodes = []

    let dataNrNodes = document.querySelectorAll("[data-nr]")
    if (dataNrNodes.length > 0 && dataNrNodes[0].classList.length == 0) {
        let { visitedLinks, allChildrenVisited } = processImagesWrapper(dataNrNodes[0], historyItemsArray)
        if (allChildrenVisited) {
            returnedNodes.push(parentNode.childNodes[0])
        } else {
            visitedLinks?.forEach(visitedLink => {
                returnedNodes.push(visitedLink)
            })
        }
    }


    childNodes.forEach(childNode => {
        let jscNode = findNodeWithJSCAtrr(childNode) || document.getElementById("iur")
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


function deleteNodes(returnedNodes) {

    returnedNodes.forEach((visitedNode) => {

        //display of none prevents content shift
        visitedNode.style.display = "none"

        // parentNode.removeChild(childNode)
    })
}

function setNodeColors(returnedNodes, chosenColor) {
    returnedNodes.forEach(returnedNode => { returnedNode.style.color = chosenColor })
}

chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { type, data, chosenColor } = obj

    if (type == "CLEARCLICK") {
        let searchNodesContainerList = document.querySelectorAll("[data-async-context]")
        searchNodesContainerList.forEach(node => {
            if (node.getAttribute("data-async-context").includes("query:")) {
                let returnedNodes = processChildNodes(node, node.childNodes, data, type)
                deleteNodes(returnedNodes)
                return
            }
        })
    } else {
        let allLinks = document.getElementsByTagName("a")
        let returnedNodes = []

        for (let i = 0; i < allLinks.length; i++) {
            let link = allLinks[i]
            if (data.find(historyItem => foundHistoryItem(historyItem, link))) {
                returnedNodes.push(link)
            }
        }
        setNodeColors(returnedNodes, chosenColor)
    }


    if (type == "COLORCHANGE") {
        chrome.storage.local.set({ "chosenColor": chosenColor })
    }

})