console.log("Content script loaded");

const returnSelection = () => {
    console.log("returnSelection called");
    return new Promise((resolve, reject) => {
        if (window.getSelection) {
            const selection = window.getSelection().toString();
            console.log("Got selection via window.getSelection:", selection.substring(0, 50) + (selection.length > 50 ? "..." : ""));
            resolve(selection);
        } else if (document.getSelection) {
            const selection = document.getSelection().toString();
            console.log("Got selection via document.getSelection:", selection.substring(0, 50) + (selection.length > 50 ? "..." : ""));
            resolve(selection);
        } else if (document.selection) {
            const selection = document.selection.createRange().text.toString();
            console.log("Got selection via document.selection:", selection.substring(0, 50) + (selection.length > 50 ? "..." : ""));
            resolve(selection);
        } else {
            console.error("No selection methods available");
            reject();
        }
    })
}

chrome.runtime.onMessage.addListener(async (request, sender, response) => {
    console.log("Content script received message:", request);
    const { type } = request
    if (type === "LOAD") {
        try {
            console.log("Getting text selection");
            const selection = await returnSelection()
            console.log("Returning selection to popup");
            response(selection)
        } catch (e) {
            console.error("Error getting selection:", e);
            response()
        }
    }
})