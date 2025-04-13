const uid = () => {
	const generateNumber = (limit) => {
	   const value = limit * Math.random();
	   return value | 0;
	}
	const generateX = () => {
		const value = generateNumber(16);
		return value.toString(16);
	}
	const generateXes = (count) => {
		let result = '';
		for(let i = 0; i < count; ++i) {
			result += generateX();
		}
		return result;
	}
	const generateconstant = () => {
		const value = generateNumber(16);
		const constant =  (value & 0x3) | 0x8;
		return constant.toString(16);
	}
    
	const generate = () => {
  	    const result = generateXes(8)
  	         + '-' + generateXes(4)
  	         + '-' + '4' + generateXes(3)
  	         + '-' + generateconstant() + generateXes(3)
  	         + '-' + generateXes(12)
  	    return result;
	};
    return generate()
};

const getToken = async () => {
    return new Promise(async (resolve, reject) => {
        const resp = await fetch("https://chat.openai.com/api/auth/session")
        if (resp.status === 403) {
            reject('CLOUDFLARE')
        }
        try {
            const data = await resp.json()
            if (!data.accessToken) {
                reject('ERROR')
            }
            resolve(data.accessToken)
        } catch (err) {
            reject('ERROR')
        }
    })
}

const getResponse = async (payload) => {
    console.log("getResponse called with payload:", payload);
    return new Promise(async (resolve, reject) => {
        try {
            // Extract data from payload
            const question = payload.question || "";
            const department = payload.department || "general";
            const additionalContext = payload.additionalContext || "";
            
            console.log("Making fetch request to localhost:8000/explain with params:", {
                text: question,
                department: department,
                additionalContext: additionalContext
            });
            
            const res = await fetch("http://localhost:8000/explain", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    "text": question,
                    "department": department,
                    "additionalContext": additionalContext
                })
            });
            
            console.log("Fetch response status:", res.status);
            
            if (!res.ok) {
                console.error("API request failed with status:", res.status);
                const errorText = await res.text();
                console.error("Error response:", errorText);
                reject("ERROR: API request failed with status " + res.status);
                return;
            }
            
            // Parse the JSON response
            const jsonResponse = await res.json();
            console.log("API response:", jsonResponse);
            
            // Send the parsed response directly
            resolve(JSON.stringify(jsonResponse));
        } catch (e) {
            console.error("Exception in getResponse:", e);
            if (e === "CLOUDFLARE") {
                reject("CLOUDFLARE");
            } else {
                reject("ERROR: " + e.message);
            }
        }
    });
};

chrome.runtime.onConnect.addListener((port) => {
    console.log("Port connected:", port.name);
    
    port.onMessage.addListener((msg) => {
        console.log("Message received on port:", msg);
        
        getResponse(msg)
            .then(jsonResponse => {
                console.log("Sending response to popup:", jsonResponse);
                
                // Add a small artificial delay to ensure the loading animation is visible
                // This can be removed in production if the API is slow enough
                setTimeout(() => {
                    port.postMessage(jsonResponse);
                }, 1500); // 1.5 second delay
            })
            .catch((error) => {
                console.error("getResponse promise rejected:", error);
                
                // Add a small artificial delay for errors too
                setTimeout(() => {
                    port.postMessage(error);
                }, 1500); // 1.5 second delay
            });
    });
    
    port.onDisconnect.addListener(() => {
        console.log("Port disconnected:", port.name);
    });
});
