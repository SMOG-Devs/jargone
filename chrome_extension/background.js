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

const getResponse = async (question) => {
    console.log("getResponse called with question:", question);
    return new Promise(async (resolve, reject) => {
        try {
            // const accessToken = await getToken();
            console.log("Making fetch request to localhost:8000/explain with payload:", JSON.stringify({ "text": question }));
            
            const res = await fetch("http://localhost:8000/explain", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // "Authorization": "Bearer " + accessToken,
                },
                body: JSON.stringify({
                    "text": question
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
        const question = msg.question;
        console.log("Processing question:", question);
        
        getResponse(question)
            .then(jsonResponse => {
                console.log("Sending response to popup:", jsonResponse);
                port.postMessage(jsonResponse);
            })
            .catch((error) => {
                console.error("getResponse promise rejected:", error);
                port.postMessage(error);
            });
    });
    
    port.onDisconnect.addListener(() => {
        console.log("Port disconnected:", port.name);
    });
});

