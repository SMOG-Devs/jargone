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

    // Migrate old history data to new format
    const migrateHistoryData = async () => {
        console.log("Checking if history migration is needed");
        try {
            const result = await chrome.storage.local.get(['jargone_history']);
            const history = result.jargone_history || [];
            
            if (history.length === 0) {
                console.log("No history to migrate");
                return;
            }
            
            let needsMigration = false;
            
            // Check if any history items are missing the department or additionalContext
            for (const item of history) {
                if (item.department === undefined || item.additionalContext === undefined) {
                    needsMigration = true;
                    break;
                }
            }
            
            if (needsMigration) {
                console.log("Migrating history data to new format");
                
                // Update each item to include department and additionalContext if missing
                const migratedHistory = history.map(item => ({
                    ...item,
                    department: item.department || "general",
                    additionalContext: item.additionalContext || ""
                }));
                
                // Save updated history
                await chrome.storage.local.set({ 'jargone_history': migratedHistory });
                console.log("History migration complete");
            } else {
                console.log("History data is already in the correct format");
            }
        } catch (e) {
            console.error("Error during history migration:", e);
        }
    };

    // History management functions
    const historyManager = {
        getHistory: async () => {
            console.log("Getting history from chrome.storage.local");
            try {
                const result = await chrome.storage.local.get(['jargone_history']);
                const history = result.jargone_history || [];
                console.log("Retrieved history items:", history.length);
                
                // Log sample of first few history items for debugging
                if (history.length > 0) {
                    console.log("Sample history item:", JSON.stringify(history[0]));
                }
                
                return history;
            } catch (e) {
                console.error("Error getting history:", e);
                return [];
            }
        },
        
        addToHistory: async (query, explanation, department, additionalContext) => {
            console.log("Adding to history:", {
                query, 
                explanation: explanation.substring(0, 50) + "...",
                department,
                additionalContext: additionalContext ? additionalContext.substring(0, 50) + "..." : "None"
            });
            
            try {
                const history = await historyManager.getHistory();
                
                // Create a new history item
                const newItem = {
                    id: Date.now(),
                    query: query,
                    explanation: explanation,
                    department: department,
                    additionalContext: additionalContext || "",
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
                
                if (!history || history.length === 0) {
                    historyContainer.innerHTML = `
                        <div class="history-empty">
                            <i class="fas fa-search fa-2x" style="opacity: 0.3; margin-bottom: 10px;"></i>
                            <p>Your search history will appear here</p>
                        </div>
                    `;
                    return;
                }
                
                let historyHTML = '';
                
                history.forEach((item, index) => {
                    try {
                        // Ensure all item properties exist
                        const id = item.id || Date.now() + index;
                        const query = item.query || "Unknown query";
                        const timestamp = item.timestamp || new Date().toISOString();
                        
                        // Format date
                        const date = new Date(timestamp);
                        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        // Get department icon and name, with fallback to "general"
                        const department = item.department || "general";
                        let deptIcon = 'fa-building';
                        if (department === 'tech') deptIcon = 'fa-laptop-code';
                        else if (department === 'finance') deptIcon = 'fa-chart-line';
                        
                        // Capitalize first letter of department
                        const displayDepartment = department.charAt(0).toUpperCase() + department.slice(1);
                        
                        console.log(`Rendering history item ${index}:`, { id, query: query.substring(0, 20) + "..." });
                        
                        // Create the history item HTML
                        historyHTML += `
                            <div class="history-item" data-id="${id}">
                                <div class="history-query">${query.length > 50 ? query.substring(0, 50) + '...' : query}</div>
                                <div class="history-meta">
                                    <span class="history-dept"><i class="fas ${deptIcon}"></i> ${displayDepartment}</span>
                                </div>
                                <div class="history-time"><i class="fas fa-clock"></i> ${formattedDate}</div>
                            </div>
                        `;
                    } catch (itemError) {
                        console.error(`Error processing history item ${index}:`, itemError, item);
                    }
                });
                
                // Set the HTML content
                historyContainer.innerHTML = historyHTML || `
                    <div class="history-empty">
                        <i class="fas fa-exclamation-circle fa-2x" style="opacity: 0.3; margin-bottom: 10px;"></i>
                        <p>Could not display history items</p>
                    </div>
                `;
                console.log("History rendering complete");
                
                // Add click event listeners to history items
                document.querySelectorAll('.history-item').forEach(item => {
                    item.addEventListener('click', async () => {
                        try {
                            const id = parseInt(item.getAttribute('data-id'));
                            console.log("History item clicked with ID:", id);
                            
                            const history = await historyManager.getHistory();
                            const historyItem = history.find(h => h.id === id);
                            
                            if (historyItem) {
                                console.log("Found history item:", historyItem);
                                
                                // Display the historical item in the main tab
                                document.getElementById('results-tab').click();
                                document.getElementById('input').innerHTML = historyItem.query || "";
                                document.getElementById('input').style.opacity = 1;
                                
                                // Set department with fallback to "general"
                                setActiveDepartment(historyItem.department || "general");
                                
                                // Set additional context if any
                                document.getElementById('additional-context').value = historyItem.additionalContext || '';
                                
                                document.getElementById('output').innerHTML = historyItem.explanation || "";
                                document.getElementById('output').style.opacity = 1;
                            } else {
                                console.error("History item not found with id:", id);
                                document.getElementById('output').innerHTML = "Error: Could not load the selected history item";
                                document.getElementById('output').style.opacity = 1;
                            }
                        } catch (e) {
                            console.error("Error displaying history item:", e);
                            document.getElementById('output').innerHTML = "Error loading history item: " + e.message;
                            document.getElementById('output').style.opacity = 1;
                        }
                    });
                });
            } catch (e) {
                console.error("Error rendering history:", e);
                historyContainer.innerHTML = `
                    <div class="history-empty">
                        <i class="fas fa-exclamation-circle fa-2x" style="color: var(--danger-color); margin-bottom: 10px;"></i>
                        <p>Error loading history: ${e.message}</p>
                    </div>
                `;
            }
        }
    };

    // Department selection handling
    const setupDepartmentSelection = () => {
        const departmentOptions = document.querySelectorAll('.department-option');
        
        departmentOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                departmentOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                option.classList.add('active');
            });
        });
    };
    
    const getActiveDepartment = () => {
        const activeOption = document.querySelector('.department-option.active');
        return activeOption ? activeOption.getAttribute('data-department') : 'general';
    };
    
    const setActiveDepartment = (department) => {
        const departmentOptions = document.querySelectorAll('.department-option');
        departmentOptions.forEach(opt => {
            if (opt.getAttribute('data-department') === department) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    };

    // Show loading animation
    const showLoading = () => {
        const outputElement = document.getElementById('output');
        outputElement.innerHTML = `
            <div class="loading-container">
                <div class="loading-jar">
                    <div class="jar-lid"></div>
                    <div class="jar-body">
                        <div class="jar-liquid"></div>
                        <div class="jar-bubbles"></div>
                    </div>
                </div>
                <div class="loading-text">Decoding jargon...</div>
            </div>
        `;
        outputElement.style.opacity = 1;
    };

    // Hide loading animation
    const hideLoading = () => {
        // The content will be replaced by the actual results
        // so we don't need to explicitly hide it
    };

    // Setup submit button
    const setupSubmitButton = () => {
        const submitButton = document.getElementById('submit-request');
        submitButton.addEventListener('click', () => {
            const selectedText = document.getElementById('input').innerHTML;
            
            if (selectedText && selectedText !== "You have to first select some text") {
                const department = getActiveDepartment();
                const additionalContext = document.getElementById('additional-context').value;
                
                // Show loading animation
                showLoading();
                
                // Process the request
                processRequest(selectedText, department, additionalContext);
            } else {
                document.getElementById('output').style.opacity = 1;
                document.getElementById('output').innerHTML = "Please select text from a webpage first.";
            }
        });
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

    const processRequest = async (text, department, additionalContext) => {
        console.log("Processing request:", { text, department, additionalContext });
        
        // Connect to background service worker
        console.log("Connecting to background service worker");
        const port = chrome.runtime.connect({ name: "popup-port" });
        
        // Create the request payload
        const payload = {
            question: text,
            department: department,
            additionalContext: additionalContext
        };
        
        console.log("Sending payload:", payload);
        port.postMessage(payload);
        
        // Handle the response
        port.onMessage.addListener((msg) => {
            console.log("Received message from background:", msg);
            
            // Hide loading animation (implicitly by replacing content)
            showPopup(msg, text, department, additionalContext);
        });
    };

    const showPopup = async (answer, selectedText, department, additionalContext) => {
        console.log("showPopup called with:", { answer, selectedText, department, additionalContext });
        let explanationContent = "";
        
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
                    
                    // Save to history
                    await historyManager.addToHistory(selectedText, explanationContent, department, additionalContext);
                    
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
        
        // Save to history for error cases as well if we have valid input
        if (selectedText && selectedText.length > 0 && explanationContent && explanationContent.length > 0) {
            await historyManager.addToHistory(selectedText, explanationContent, department, additionalContext);
        }
    }

    const getData = async (selection) => {
        console.log("getData called with selection:", selection);
        if (selection.length != 0) {
            document.getElementById('input').style.opacity = 1;
            document.getElementById('input').innerHTML = selection;
            document.getElementById('output').style.opacity = 0;
            document.getElementById('output').innerHTML = "";
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
    setupDepartmentSelection();
    setupSubmitButton();
    await migrateHistoryData();
    await historyManager.renderHistory();
    getSelectedText();
});