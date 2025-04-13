document.addEventListener("DOMContentLoaded", async () => {
    console.log("Popup loaded");

    // Test Chrome storage API functionality immediately
    try {
        console.log("Testing chrome.storage.local availability");
        const testValue = "test_" + Date.now();
        await chrome.storage.local.set({ 'jargone_test': testValue });
        const result = await chrome.storage.local.get(['jargone_test']);
        const retrievedValue = result.jargone_test;
        console.log(`Test write: ${testValue}, test read: ${retrievedValue}`);
        
        if (testValue !== retrievedValue) {
            console.error("chrome.storage.local test failed: values don't match");
            document.getElementById('output').innerHTML = "Error: Browser storage not working properly";
        } else {
            console.log("chrome.storage.local basic functionality test passed");
            await chrome.storage.local.remove(['jargone_test']);
        }
    } catch (e) {
        console.error("chrome.storage.local test failed with exception:", e);
        document.getElementById('output').innerHTML = "Error: " + e.message;
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // History management functions
    const historyManager = {
        getHistory: async () => {
            console.log("Getting history from chrome.storage.local");
            try {
                const result = await chrome.storage.local.get(['jargone_history']);
                const history = result.jargone_history || [];
                console.log("Retrieved history items:", history.length);
                return history;
            } catch (e) {
                console.error("Error getting history:", e);
                return [];
            }
        },
        
        addToHistory: async (query, explanation) => {
            console.log("Adding to history:", {query, explanation: explanation.substring(0, 50) + "..."});
            
            try {
                const history = await historyManager.getHistory();
                
                // Create a new history item
                const newItem = {
                    id: Date.now(),
                    query: query,
                    explanation: explanation,
                    timestamp: new Date().toISOString()
                };
                
                console.log("New history item:", newItem);
                
                // Add to the beginning of the array (newest first)
                history.unshift(newItem);
                
                // Keep only the last 50 items
                const trimmedHistory = history.slice(0, 50);
                
                // Save back to storage
                await chrome.storage.local.set({ 'jargone_history': trimmedHistory });
                console.log("History saved successfully, new count:", trimmedHistory.length);
                
                // Update the UI
                historyManager.renderHistory();
            } catch (e) {
                console.error("Error adding to history:", e);
            }
        },
        
        clearHistory: async () => {
            console.log("Clearing history");
            try {
                await chrome.storage.local.remove(['jargone_history']);
                console.log("History cleared successfully");
                historyManager.renderHistory();
            } catch (e) {
                console.error("Error clearing history:", e);
            }
        },
        
        renderHistory: async () => {
            console.log("Rendering history UI");
            const historyContainer = document.getElementById('history-container');
            
            try {
                const history = await historyManager.getHistory();
                console.log("Current history items:", history.length);
                
                if (history.length === 0) {
                    historyContainer.innerHTML = `
                        <div class="history-empty">
                            <i class="fas fa-search fa-2x" style="opacity: 0.3; margin-bottom: 10px;"></i>
                            <p>Your search history will appear here</p>
                        </div>
                    `;
                    return;
                }
                
                let historyHTML = '';
                
                history.forEach(item => {
                    const date = new Date(item.timestamp);
                    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    historyHTML += `
                        <div class="history-item" data-id="${item.id}">
                            <div class="history-query">${item.query.length > 50 ? item.query.substring(0, 50) + '...' : item.query}</div>
                            <div class="history-time"><i class="fas fa-clock"></i> ${formattedDate}</div>
                        </div>
                    `;
                });
                
                historyContainer.innerHTML = historyHTML;
                
                // Add click event listeners to history items
                document.querySelectorAll('.history-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        const id = parseInt(item.getAttribute('data-id'));
                        const history = await historyManager.getHistory();
                        const historyItem = history.find(h => h.id === id);
                        
                        if (historyItem) {
                            // Display the historical item in the main tab
                            document.getElementById('results-tab').click();
                            document.getElementById('input').innerHTML = historyItem.query;
                            document.getElementById('input').style.opacity = 1;
                            document.getElementById('output').innerHTML = historyItem.explanation;
                            document.getElementById('output').style.opacity = 1;
                        }
                    });
                });
            } catch (e) {
                console.error("Error rendering history:", e);
                historyContainer.innerHTML = `
                    <div class="history-empty">
                        <p>Error loading history: ${e.message}</p>
                    </div>
                `;
            }
        }
    };

    // Tab switching functionality
    const setupTabs = () => {
        console.log("Setting up tabs");
        const resultTab = document.getElementById('results-tab');
        const historyTab = document.getElementById('history-tab');
        const resultContent = document.getElementById('results-content');
        const historyContent = document.getElementById('history-content');
        
        resultTab.addEventListener('click', () => {
            console.log("Results tab clicked");
            resultTab.classList.add('active');
            historyTab.classList.remove('active');
            resultContent.style.display = 'flex';
            historyContent.style.display = 'none';
        });
        
        historyTab.addEventListener('click', () => {
            console.log("History tab clicked");
            historyTab.classList.add('active');
            resultTab.classList.remove('active');
            historyContent.style.display = 'flex';
            resultContent.style.display = 'none';
            
            // Refresh history when tab is opened
            historyManager.renderHistory();
        });
        
        // Setup clear history button
        document.getElementById('clear-history').addEventListener('click', () => {
            console.log("Clear history button clicked");
            historyManager.clearHistory();
        });
    };

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
        let explanationContent = "";
        let selectedText = document.getElementById('input').innerHTML;
        
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
                    explanationContent = output;
                    
                    // Save to history right after displaying
                    if (selectedText && selectedText.length > 0) {
                        console.log("Saving to history with text:", selectedText);
                        await historyManager.addToHistory(selectedText, explanationContent);
                    } else {
                        console.log("Not saving to history - empty selection");
                    }
                    
                    return;
                }
            } catch (e) {
                console.error("JSON parse error:", e);
                document.getElementById('output').style.opacity = 1;
                document.getElementById('output').innerHTML = `Error parsing response: ${e.message}<br><br>Raw response: ${answer}`;
                explanationContent = `Error parsing response: ${e.message}`;
            }
        } else if (answer === "CLOUDFLARE") {
            console.log("Handling CLOUDFLARE error");
            document.getElementById('input').style.opacity = 1;
            document.getElementById('input').innerHTML = 'You need to once visit <a target="_blank" href="https://chat.openai.com/chat">chat.openai.com</a> and check if the connection is secure. Redirecting...';
            await sleep(3000);
            chrome.tabs.create({url: "https://chat.openai.com/chat"});
            explanationContent = "CLOUDFLARE error";
        } else {
            console.log("Handling general error:", answer);
            document.getElementById('output').style.opacity = 1;
            document.getElementById('output').innerHTML = 'Something went wrong. Error: ' + answer;
            explanationContent = 'Error: ' + answer;
        }
        
        // Save to history outside of success case as well
        if (selectedText && selectedText.length > 0 && explanationContent && explanationContent.length > 0) {
            console.log("Saving to history outside success path:", selectedText);
            await historyManager.addToHistory(selectedText, explanationContent);
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

    // Initialize
    setupTabs();
    await historyManager.renderHistory();
    getSelectedText();
});