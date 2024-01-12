//This is the div with a bunch of images in it
function processImagesWrapper(imagesWrapper, historyItemsArray, allVisitedNode) {

    let visitedLinks = []
    let visitedCount = 0
    imagesWrapper.childNodes.forEach(container => {
        let hasJsAttribute = container.getAttribute("jsname")
        let imageContainer = hasJsAttribute ? container : container.firstChild
        let link = imageContainer.childNodes[1].firstChild
        if (link.tagName != "A" || !historyItemsArray.find(dataNode => foundHistoryItem(dataNode, link))) {
            return { visitedLinks, allChildrenVisited: false }
        }

        visitedCount += 1
        if (hasJsAttribute) {
            visitedLinks.push(container)
        } else {
            visitedLinks.push(imageContainer)
        }

    })

    let allChildrenVisited = (visitedCount > 0 && visitedCount == imagesWrapper.childNodes.length)

    return (allChildrenVisited ? [allVisitedNode] : visitedLinks)
}


function handleImagesNode(historyItemsArray, allVisitedNode) {
    let dataNrNodes = document.querySelectorAll("[data-nr]")
    if (dataNrNodes.length > 0 && dataNrNodes[0].classList.length == 0) {
        return processImagesWrapper(dataNrNodes[0], historyItemsArray, allVisitedNode)
    }
    return []
}