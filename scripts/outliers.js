//This is the div with a bunch of images in it
function processImagesWrapper(imagesWrapper, historyItems, allVisitedNode) {

    let visitedLinks = []
    let visitedCount = 0
    let childNodesLength = imagesWrapper.childNodes ? imagesWrapper.childNodes.length : 0

    imagesWrapper.childNodes?.forEach(container => {

        let hasJsAttribute = container.getAttribute("jsname")
        let imageContainer = hasJsAttribute ? container : container.firstChild
        let link = imageContainer.childNodes ? imageContainer.childNodes[1]?.firstChild : undefined


        if (!link || link.tagName != "A" || !foundHistoryItem(historyItems, link)) {
            return
        }

        visitedCount += 1
        if (hasJsAttribute) {
            visitedLinks.push(container)
        } else {
            visitedLinks.push(imageContainer)
        }

    })

    let allChildrenVisited = (visitedCount > 0 && visitedCount == childNodesLength)

    return (allChildrenVisited ? [allVisitedNode] : visitedLinks)
}


function processImages(historyItems, allVisitedNode) {
    let dataNrNodes = document.querySelectorAll("[data-nr]")

    for (let i = 0; i < dataNrNodes.length; i++) {
        if (dataNrNodes[i].classList.length == 0 && !dataNrNodes[i].class) {
            return processImagesWrapper(dataNrNodes[i], historyItems, allVisitedNode)
        }
    }
    return []
}


function processTable(historyItems) {
    //handle possible table
    let table = document.getElementsByTagName("table")
    let visitedLinks = []
    let allChildrenVisited = false
    let visitedCount = 0

    let tableRowsContainer = table.length > 0 ? table[table.length - 1] : undefined

    if (!tableRowsContainer) {
        return visitedLinks
    }

    let rows = tableRowsContainer.rows
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

        if (foundHistoryItem(historyItems, link)) {
            visitedCount += 1
            visitedLinks.push(rows[i])
        }
    }

    allChildrenVisited = (visitedCount == rows.length - 1)
    if (!allChildrenVisited) {
        return visitedLinks
    }


    //now check for the main link to see if we remove entire block or just the table links
    let baseLink = tableRowsContainer.parentNode.firstChild
    while (baseLink && baseLink.tagName != "A") {
        baseLink = baseLink.firstChild
    }
    if (!baseLink) {
        return visitedLinks
    }
    if (foundHistoryItem(historyItems, baseLink)) {
        return [tableRowsContainer.parentElement.parentElement.parentElement]
    }

    return visitedLinks
}

function getHeading(headingInnerText) {
    let headingNodes = document.querySelectorAll(`[role="heading"]`)
    let videoHeadingNode = undefined;
    for (let i = 0; i < headingNodes.length; i++) {
        if (headingNodes[i].firstChild && (headingNodes[i].firstChild.tagName == "SPAN" || headingNodes[i].tagName == "DIV") && (headingNodes[i].firstChild.innerText == headingInnerText || headingNodes[i].innerText == headingInnerText)) {
            return headingNodes[i]
        }
    }
    return undefined
}


//these two functions are very similar
//TODO: Refactor these and use a switch statement in order to get the proper links container based off an arg
function processVideos(historyItems) {
    let videoHeadingNode = getHeading("Videos");

    if (!videoHeadingNode) {
        return []
    }

    let visitedLinks = []
    let videosContainer = videoHeadingNode.parentNode.parentNode.parentNode.parentNode.childNodes[1]?.childNodes[1]

    let visitedCount = 0
    let childNodesLength = videosContainer.childNodes ? videosContainer.childNodes.length : 0
    videosContainer.childNodes?.forEach(video => {
        let link = video
        while (link && link.tagName != "A") {
            link = link.firstChild
        }
        if (!link) {
            return
        }

        //the first child link is for the image and has no href to match against the history


        let hrefLink = (link.role && link.role == "button") ? link.parentNode.childNodes[1] : link
        if (!hrefLink || !foundHistoryItem(historyItems, hrefLink)) {
            return
        }

        visitedCount += 1
        visitedLinks.push(video)

    })

    if (visitedCount > 0 && visitedCount == childNodesLength) {
        return [videosContainer.parentNode.parentNode.parentNode.parentNode]
    }
    return visitedLinks
}

function processDiscussionsAndForums(historyItems) {
    let discussionAndForumHeading = getHeading("Discussions and forums")
    if (!discussionAndForumHeading) {
        return []
    }

    let linksContainer = discussionAndForumHeading.parentNode.parentNode.childNodes[1]?.firstChild
    let visitedLinks = []
    let visitedCount = 0
    let childNodesLength = linksContainer.childNodes ? linksContainer.childNodes.length : 0
    linksContainer.childNodes?.forEach(linkContainer => {
        let link = linkContainer
        while (link && link.tagName != "A") {
            link = link.firstChild
        }
        if (!link || !foundHistoryItem(historyItems, link)) {
            return
        }
        visitedCount += 1
        visitedLinks.push(linkContainer)
    })

    return (
        (visitedCount > 0 && visitedCount == childNodesLength) ?
            [discussionAndForumHeading.parentNode.parentNode.parentNode.parentNode] :
            visitedLinks
    )
}

function processBlockComponent(historyItems) {
    let blockComponent = document.getElementsByTagName("BLOCK-COMPONENT")[0]
    if (!blockComponent) {
        return []
    }

    //I have no idea what a good name for this variable could be
    let initialContainer = blockComponent
    while (initialContainer.firstChild && initialContainer.firstChild.tagName != "H2") {
        initialContainer = initialContainer.firstChild
    }

    if (!initialContainer) {
        return []
    }

    let startingLinkContainer = initialContainer.childNodes[1]
    while (startingLinkContainer.childNodes?.length == 1) {
        startingLinkContainer = startingLinkContainer.firstChild
    }
    if (!startingLinkContainer) {
        return []
    }

    let link = startingLinkContainer.childNodes[1]
    while (link && link.tagName != "A") {
        link = link.firstChild
    }

    if (!link || !foundHistoryItem(historyItems, link)) {
        return []
    }

    let finalParentNode = blockComponent
    while (finalParentNode && !(finalParentNode.parentNode.getAttribute && finalParentNode.parentNode.getAttribute("data-async-context")) && finalParentNode.childNodes[0].tagName != "H1") {
        finalParentNode = finalParentNode.parentNode
    }
    return [finalParentNode]
}

function processSearchIconNode(historyItems) {
    //cn = childNodes
    let cn1 = document.getElementById("bres").childNodes
    if (!cn1 || cn1.length == 0) {
        return
    }
    let cn2 = cn1[cn1.length - 1].firstChild?.firstChild?.firstChild?.childNodes
    if (!cn2 || cn2.length == 0) {
        return
    }

    let mainContainer = cn2[cn2.length - 1]
    let totalChildrenCount = 0
    let visitedCount = 0
    let visitedLinks = []

    mainContainer.firstChild?.childNodes.forEach(linkContainerWrapper => {
        linkContainerWrapper.childNodes.forEach(linkContainer => {
            let link = linkContainer.firstChild
            totalChildrenCount += 1
            if (!link || link.tagName != "A") {
                return
            }

            if (foundHistoryItem(historyItems, link)) {
                visitedCount += 1
                visitedLinks.push(link)
            }
        })
    })


    if (visitedCount > 0 && visitedCount == totalChildrenCount) {
        return [mainContainer.parentNode.parentNode.parentNode.parentNode]
    }

    return visitedLinks
}

function processRelatedSearches(historyItems) {
    let relatedSearchesHeading = getHeading("Related searches")
    if (!relatedSearchesHeading) {
        return []
    }

    let containerWrapper = relatedSearchesHeading.parentNode.parentNode.parentNode.childNodes[1]
    let visitedLinks = []

    let totalChildrenCount = 0
    let totalVisitedCount = 0

    containerWrapper.childNodes?.forEach((container, index) => {
        if (!container.getAttribute("data-hveid")) {
            return
        }
        let linkContainer;
        if (index == 1) {
            linkContainer = container.firstChild.childNodes[1].childNodes[2].firstChild.firstChild.firstChild.childNodes[1].firstChild.firstChild.firstChild
        } else if (index % 2 == 1) {
            let medium = container.firstChild.firstChild.childNodes[2].firstChild.firstChild
            console.log(medium)
            linkContainer = container.firstChild.firstChild.childNodes[2].firstChild.firstChild.firstChild.childNodes[1].firstChild.firstChild.firstChild
        }

        // if (!linkContainer) {
        //     return
        // }

        // let currentVisitedCount = 0

        // linkContainer.childNodes.forEach(link => {
        //     totalChildrenCount += 1
        //     if (foundHistoryItem(historyItems, link)) {
        //         visitedLinks.push(link)
        //         visitedCount += 1
        //         currentVisitedCount += 1
        //     }
        // })

        // if (currentVisitedCount > 0 && currentVisitedCount == linkContainer.childNodes.length) {
        //     console.log(container)
        // }
    })
}

function handleOutliers(parentNode, childNodes, historyItems) {

    //could probably remove intermediary visitedLinks var but it reminds me of what the functions return
    let returnLinks = []
    {
        let allVisitedNode = parentNode.childNodes[0]
        let visitedLinks = processImages(historyItems, allVisitedNode)
        appendLinks(visitedLinks, returnLinks)
    }
    {
        let visitedLinks = processTable(historyItems)
        appendLinks(visitedLinks, returnLinks)

    }
    {
        let visitedLinks = processVideos(historyItems)
        appendLinks(visitedLinks, returnLinks)

    }
    {
        let visitedLinks = processDiscussionsAndForums(historyItems)
        appendLinks(visitedLinks, returnLinks)

    }
    {
        let visitedLinks = processBlockComponent(historyItems)
        appendLinks(visitedLinks, returnLinks)

    }
    {
        let visitedLinks = processSearchIconNode(historyItems)
        appendLinks(visitedLinks, returnLinks)
    }

    return returnLinks
}
