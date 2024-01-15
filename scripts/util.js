function deleteNodes(returnedNodes) {
    returnedNodes.forEach((visitedNode) => {
        //display of none prevents wonky content display vs removing from DOM
        visitedNode.style.display = "none"

    })
}

function setDescendantsColor(returnedNode, chosenColor) {
    if (returnedNode.style) {
        returnedNode.style.color = chosenColor
    }
    returnedNode.childNodes?.forEach(childNode => {
        setDescendantsColor(childNode, chosenColor)
    })
}
function setNodeColors(returnedNodes, chosenColor) {
    returnedNodes.forEach(returnedNode => {
        setDescendantsColor(returnedNode, chosenColor)
    })
}

function foundHistoryItem(historyItems, visitedLink) {

    let index = historyItems.findIndex(dataNode => {
        return dataNode.url == visitedLink.href || dataNode.title == visitedLink.text
    })

    return index != -1
}

function appendLinks(visitedLinks, returnLinks) {
    visitedLinks?.forEach(visitedLink => {
        returnLinks.push(visitedLink)
    })
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
    if (returnNode && !returnNode.childNodes[1]?.getAttribute("jsslot")) {
        return returnNode
    }

    //Third Scenario
    while (firstChild && firstChild.getAttribute) {

        if (firstChild.getAttribute("data-surl")?.startsWith("https://www.youtube.com") || firstChild.href?.startsWith("https://www.youtube.com")) {
            return firstChild
        }

        if ((firstChild.firstChild && firstChild.firstChild.tagName == "H2") || (firstChild.getAttribute("jsaction") && firstChild.getAttribute("jsshadow") && firstChild.tagName == "DIV") || (firstChild.firstChild && firstChild.firstChild.tagName == "SCRIPT")) {
            let childNodesLength = firstChild.childNodes.length
            firstChild = firstChild.childNodes[childNodesLength - 1]
        } else {
            firstChild = firstChild.firstChild
        }
    }

    return undefined

}

function initializeObserver() {

    const callback = (mutationList, observer) => {
        //check if user enabled auto clear
        if (!autoClearStatus) {
            return
        }

        if (mutationList.length == 0) {
            return
        }

        mutationList[mutationList.length - 1].target.firstChild.childNodes.forEach(node => {
            let returnedNodes = processChildNodes(node, node.childNodes, previoushistoryItems, "CLEARCLICK")
            console.log(returnedNodes)
            //deleteNodes(returnedNodes)
            return

        })
        // let all = document.querySelectorAll("[data-nr]")

    };

    const botstuff = document.getElementById("botstuff");
    const config = { subtree: true, childList: true };
    const observer = new MutationObserver(callback);
    observer.observe(botstuff, config);
}
