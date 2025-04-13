document.addEventListener("DOMContentLoaded", async () => {
    console.log("Popup loaded");

    const sleep = ms => new Promise(r => setTimeout(r, ms))

    const getActiveTab = async () => {
        console.log("Getting active tab");
        const tabs = await chrome.tabs.query({
            currentWindow: true,
            active: true
        })
        console.log("Active tab:", tabs[0]);
        return tabs[0]
    }

    const showPopup = async (answer) => {
        console.log("showPopup called with answer:", answer);
        
        if (answer !== "CLOUDFLARE" && !answer.startsWith("ERROR")) {
            try {
                console.log("Processing normal response");
                
                // Try parsing the answer as JSON
                const jsonResponse = JSON.parse(answer);
                console.log("Parsed JSON response:", jsonResponse);
                
                if (jsonResponse.explanation) {
                    console.log("Found explanation:", jsonResponse.explanation);
                    let output = `<div class="explanation">${jsonResponse.explanation}</div>`;
                    
                    if (jsonResponse.definitions && jsonResponse.definitions.length > 0) {
                        console.log("Found definitions:", jsonResponse.definitions);
                        output += `<div class="definitions"><h3>Definitions:</h3><ul>`;
                        
                        jsonResponse.definitions.forEach(def => {
                            output += `<li><strong>${def.entity}</strong>: ${def.definition}</li>`;
                        });
                        
                        output += `</ul></div>`;
                    }
                    
                    document.getElementById('output').style.opacity = 1;
                    document.getElementById('output').innerHTML = output;
                    return;
                }
            } catch (e) {
                console.error("JSON parse error:", e);
                document.getElementById('output').style.opacity = 1;
                document.getElementById('output').innerHTML = `Error parsing response: ${e.message}<br><br>Raw response: ${answer}`;
            }
        } else if (answer === "CLOUDFLARE") {
            console.log("Handling CLOUDFLARE error");
            document.getElementById('input').style.opacity = 1;
            document.getElementById('input').innerHTML = 'You need to once visit <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a> and check if the connection is secure. Redirecting...';
            await sleep(3000);
            chrome.tabs.create({url: "https://chat.openai.com/chat"});
        } else {
            console.log("Handling general error:", answer);
            document.getElementById('output').style.opacity = 1;
            document.getElementById('output').innerHTML = 'Something went wrong. Error: ' + answer;
        }
    }

    const getData = async (selection) => {
        console.log("getData called with selection:", selection);
        if (selection.length != 0) {
            document.getElementById('input').style.opacity = 1;
            document.getElementById('input').innerHTML = selection;
            document.getElementById('output').style.opacity = 0.5;
            document.getElementById('output').innerHTML = "Loading...";
            console.log("Connecting to background service worker");
            const port = chrome.runtime.connect({name: "popup-port"});
            console.log("Posting message with question:", selection);
            port.postMessage({question: selection});
            port.onMessage.addListener((msg) => {
                console.log("Received message from background:", msg);
                showPopup(msg);
            });
        } else {
            console.log("No text selected");
            document.getElementById('input').style.opacity = 0.5;
            document.getElementById('input').innerHTML = "You have to first select some text";
        }
    }

    const getSelectedText = async () => {
        console.log("Getting selected text");
        const activeTab = await getActiveTab();
        console.log("Sending message to content script");
        chrome.tabs.sendMessage(activeTab.id, {type: "LOAD"}, (response) => {
            console.log("Received response from content script:", response);
            getData(response || "");
        });
    }

    getSelectedText();
});