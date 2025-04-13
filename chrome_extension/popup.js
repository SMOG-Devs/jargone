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

    // User Profile Management
    const profileManager = {
        getProfile: async () => {
            console.log("Getting user profile");
            try {
                const result = await chrome.storage.local.get(['jargone_profile']);
                // Default profile if none exists
                const profile = result.jargone_profile || {
                    explanationLevel: "detailed",
                    userRole: "",
                    defaultContext: ""
                };
                console.log("Retrieved profile:", profile);
                return profile;
            } catch (e) {
                console.error("Error getting profile:", e);
                return { explanationLevel: "detailed", userRole: "", defaultContext: "" };
            }
        },
        
        saveProfile: async (explanationLevel, userRole, defaultContext) => {
            console.log("Saving user profile:", { explanationLevel, userRole, defaultContext });
            try {
                const profile = {
                    explanationLevel: explanationLevel,
                    userRole: userRole || "",
                    defaultContext: defaultContext || ""
                };
                
                await chrome.storage.local.set({ 'jargone_profile': profile });
                console.log("Profile saved successfully");
                return true;
            } catch (e) {
                console.error("Error saving profile:", e);
                return false;
            }
        },
        
        loadProfileUI: async () => {
            console.log("Loading profile into UI");
            const profile = await profileManager.getProfile();
            
            // Set explanation level selection
            const levelButtons = document.querySelectorAll('.profile-department-option');
            levelButtons.forEach(button => {
                if (button.dataset.level === profile.explanationLevel) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
            
            // Set user role
            const userRoleInput = document.getElementById('profile-user-role');
            if (userRoleInput) {
                userRoleInput.value = profile.userRole || "";
            }
            
            // Set default context
            const contextInput = document.getElementById('profile-default-context');
            if (contextInput) {
                contextInput.value = profile.defaultContext || "";
            }
        },
        
        setupProfileListeners: () => {
            console.log("Setting up profile UI listeners");
            
            // Explanation level selection in profile
            const levelButtons = document.querySelectorAll('.profile-department-option');
            levelButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remove active class from all buttons
                    levelButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked button
                    button.classList.add('active');
                });
            });
            
            // Save profile button
            const saveButton = document.getElementById('save-profile');
            if (saveButton) {
                saveButton.addEventListener('click', async () => {
                    // Get selected explanation level
                    const activeButton = document.querySelector('.profile-department-option.active');
                    const explanationLevel = activeButton ? activeButton.dataset.level : "detailed";
                    
                    // Get user role
                    const userRole = document.getElementById('profile-user-role').value;
                    
                    // Get default context
                    const defaultContext = document.getElementById('profile-default-context').value;
                    
                    // Save profile
                    const success = await profileManager.saveProfile(explanationLevel, userRole, defaultContext);
                    
                    if (success) {
                        // Show toast notification
                        const toastElement = document.getElementById('toast-notification');
                        if (toastElement) {
                            toastElement.classList.add('show');
                            
                            // Remove show class after animation completes
                            setTimeout(() => {
                                toastElement.classList.remove('show');
                            }, 3000);
                        }
                    }
                });
            }
        }
    };

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
        
        addToHistory: async (query, explanation, explanationLevel, userRole, additionalContext) => {
            console.log("Adding to history:", {
                query, 
                explanation: explanation.substring(0, 50) + "...",
                explanationLevel,
                userRole,
                additionalContext: additionalContext ? additionalContext.substring(0, 50) + "..." : "None"
            });
            
            try {
                const history = await historyManager.getHistory();
                
                // Create a new history item
                const newItem = {
                    id: Date.now(),
                    query: query,
                    explanation: explanation,
                    explanationLevel: explanationLevel,
                    userRole: userRole,
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
                        
                        // Get explanation level icon and label, with fallback to "detailed"
                        const explanationLevel = item.explanationLevel || "detailed";
                        let levelIcon = 'fa-user-graduate';
                        let levelLabel = 'Detailed';
                        
                        if (explanationLevel === 'basic') {
                            levelIcon = 'fa-user';
                            levelLabel = 'Basic';
                        } else if (explanationLevel === 'expert') {
                            levelIcon = 'fa-brain';
                            levelLabel = 'Expert';
                        }
                        
                        console.log(`Rendering history item ${index}:`, { id, query: query.substring(0, 20) + "..." });
                        
                        // Create the history item HTML
                        historyHTML += `
                            <div class="history-item" data-id="${id}">
                                <div class="history-query">${query.length > 50 ? query.substring(0, 50) + '...' : query}</div>
                                <div class="history-meta">
                                    <span class="history-dept"><i class="fas ${levelIcon}"></i> ${levelLabel}</span>
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
        
        // Scroll to make the loading animation visible
        scrollToElement(outputElement);
    };

    // Scroll to an element smoothly with a slight delay to ensure animation starts
    const scrollToElement = (element) => {
        // Short delay to ensure the DOM has updated
        setTimeout(() => {
            // Get the main container that has the scrollbar
            const mainContainer = document.querySelector('main');
            
            if (mainContainer && element) {
                // Get the output container for more precise scrolling
                const outputContainer = document.querySelector('.output-container');
                
                if (outputContainer) {
                    // Calculate the scroll position to show the output area at the top
                    const outputContainerTop = outputContainer.getBoundingClientRect().top;
                    const mainContainerTop = mainContainer.getBoundingClientRect().top;
                    const scrollTop = outputContainerTop - mainContainerTop + mainContainer.scrollTop - 20; // 20px buffer
                    
                    // Scroll smoothly to the element
                    mainContainer.scrollTo({
                        top: scrollTop,
                        behavior: 'smooth'
                    });
                    
                    console.log("Scrolled to position:", scrollTop);
                } else {
                    // Fallback to the original calculation
                    const elementRect = element.getBoundingClientRect();
                    const containerRect = mainContainer.getBoundingClientRect();
                    
                    // Calculate the scroll position to center the element
                    const scrollTop = elementRect.top - containerRect.top - 
                                    (containerRect.height / 3); // Show in the upper third
                    
                    // Scroll smoothly to the element
                    mainContainer.scrollTo({
                        top: mainContainer.scrollTop + scrollTop,
                        behavior: 'smooth'
                    });
                    
                    console.log("Fallback scroll to position:", mainContainer.scrollTop + scrollTop);
                }
            }
        }, 100); // Short delay for DOM updates
    };

    // Hide loading animation
    const hideLoading = () => {
        // The content will be replaced by the actual results
        // so we don't need to explicitly hide it
    };

    // Setup submit button
    const setupSubmitButton = () => {
        console.log("Setting up submit button");
        const submitButton = document.getElementById('submit-request');
        
        if (submitButton) {
            submitButton.addEventListener('click', async () => {
                const input = document.getElementById('input');
                
                if (!input || !input.textContent.trim()) {
                    console.log("No input text to process");
                    return;
                }
                
                // Get user profile for department, userRole and defaultContext
                const profile = await profileManager.getProfile();
                
                // Process the request
                await processRequest(input.textContent, profile.explanationLevel, profile.userRole, profile.defaultContext);
            });
            } else {
            console.error("Submit button not found!");
            }
    };

    // Tab switching functionality
    const setupTabs = () => {
        console.log("Setting up tabs");
        
        const tabs = {
            'results-tab': 'results-content',
            'history-tab': 'history-content',
            'profile-tab': 'profile-content'
        };
        
        for (const [tabButton, tabContent] of Object.entries(tabs)) {
            const button = document.getElementById(tabButton);
            const content = document.getElementById(tabContent);
            
            if (button && content) {
                button.addEventListener('click', () => {
                    // Hide all tab contents
                    Object.values(tabs).forEach(id => {
                        const element = document.getElementById(id);
                        if (element) element.style.display = 'none';
                    });
                    
                    // Remove active class from all tab buttons
                    Object.keys(tabs).forEach(id => {
                        const element = document.getElementById(id);
                        if (element) element.classList.remove('active');
                    });
                    
                    // Show selected tab content and set active class
                    content.style.display = 'block';
                    button.classList.add('active');
                    
                    // If profile tab is selected, load profile data
                    if (tabButton === 'profile-tab') {
                        profileManager.loadProfileUI();
                    }
                });
            } else {
                console.error(`Tab element not found: button=${tabButton}, content=${tabContent}`);
            }
        }
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

    const processRequest = async (text, explanationLevel, userRole, additionalContext) => {
        console.log(`Processing request with explanation level: ${explanationLevel}, user role: ${userRole}, text length: ${text.length}`);
        
        // Show loading animation
        showLoading();
        
        try {
            // Connect to background service worker
            console.log("Connecting to background service worker");
            const port = chrome.runtime.connect({ name: "popup-port" });
            
            // Create the request payload with updated profile data
            const payload = {
                question: text,
                explanationLevel: explanationLevel,
                userRole: userRole,
                additionalContext: additionalContext
            };
            
            console.log("Sending payload:", payload);
            port.postMessage(payload);
            
            // Handle the response
            port.onMessage.addListener((msg) => {
                console.log("Received message from background:", msg);
                
                // Hide loading animation (implicitly by replacing content)
                showPopup(msg, text, explanationLevel, userRole, additionalContext);
            });
        } catch (error) {
            console.error("Error processing request:", error);
            hideLoading();
            document.getElementById('output').innerHTML = "Error: Unable to process your request.";
        }
    };

    const showPopup = async (answer, selectedText, explanationLevel, userRole, additionalContext) => {
        console.log("showPopup called with:", { answer, selectedText, explanationLevel, userRole, additionalContext });
        let explanationContent = "";
        const outputElement = document.getElementById('output');
        
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
                    
                    // Add user role information if provided
                    if (userRole && userRole.trim()) {
                        output += `<div class="user-role-note">
                            <p><strong>Tailored for:</strong> ${userRole}</p>
                        </div>`;
                    }
                    
                    // Add additional context note if provided
                    if (additionalContext && additionalContext.trim()) {
                        output += `<div class="context-note">
                            <p><strong>Additional context applied:</strong> ${additionalContext}</p>
                        </div>`;
                    }
                    
                    explanationContent = output;
                    outputElement.innerHTML = output;
                    outputElement.style.opacity = 1;
                    scrollToElement(outputElement);
                    
                    // Save to history
                    historyManager.addToHistory(selectedText, explanationContent, explanationLevel, userRole, additionalContext);
                    
                    return;
                } else {
                    explanationContent = answer;
                }
            } catch (e) {
                console.error("Error parsing JSON response:", e);
                explanationContent = answer;
            }
        } else if (answer === "CLOUDFLARE") {
            // Handle Cloudflare error
            explanationContent = '<div class="error">Cloudflare is blocking the request. Please visit <a href="https://chat.openai.com" target="_blank">chat.openai.com</a> and check if the connection is secure. Redirecting...</div>';
            outputElement.innerHTML = explanationContent;
            outputElement.style.opacity = 1;
            window.open("https://chat.openai.com");
        } else {
            // Handle other errors
            explanationContent = `<div class="error">An error occurred: ${answer}</div>`;
            outputElement.innerHTML = explanationContent;
            outputElement.style.opacity = 1;
        }
        
        // Save to history for error cases as well if we have valid input
        if (selectedText && selectedText.length > 0 && explanationContent && explanationContent.length > 0) {
            historyManager.addToHistory(selectedText, explanationContent, explanationLevel, userRole, additionalContext);
        }
    };

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
    setupSubmitButton();
    await migrateHistoryData();
    await historyManager.renderHistory();
    getSelectedText();

    // ===== Initialize the extension =====
    (async function init() {
        try {
            // Load selected text from the active tab
            const selectedText = await getSelectedText();
            
            // Update the UI with the selected text
            const inputElement = document.getElementById('input');
            if (inputElement) {
                inputElement.innerHTML = selectedText || "Select text on any webpage to explain jargon";
            }
            
            // Load user profile
            await profileManager.getProfile();
            
            // Set up the profile UI and event listeners
            profileManager.setupProfileListeners();
            
            // Set up tabs
            setupTabs();
            
            // Set up submit button
            setupSubmitButton();
            
            // Set up history refresh (when history tab is clicked)
            document.getElementById('history-tab').addEventListener('click', () => {
                historyManager.renderHistory();
            });
            
            // Setup clear history button
            document.getElementById('clear-history').addEventListener('click', () => {
                historyManager.clearHistory();
            });
            
            // Migrate old history data if needed
            await migrateHistoryData();
        } catch (error) {
            console.error("Error initializing extension:", error);
        }
    })();
});