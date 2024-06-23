function save(e) {
	e.preventDefault();
	const apiKey = document.getElementById("apiKey").value;
	fetch("https://api.cohere.com/v1/check-api-key", {
		method: "POST",
		headers: {
			accept: "application/json",
			"content-type": "application/json",
			Authorization: `bearer ${apiKey}`,
		},
		body: "",
	})
		.then((res) => res.json())
		.then((res) => {
			// alert(JSON.stringify(res));
			// console.log(res);
			const msg = document.getElementById("errorMessage");
			if (res.valid) {
				chrome.storage.local.set({ apiKey }).then(load);
				msg.classList.add("max-h-0", "opacity-0");
				msg.classList.remove("max-h-40", "opacity-100");
			} else {
				msg.classList.remove("max-h-0", "opacity-0");
				msg.classList.add("max-h-40", "opacity-100");
			}
		});
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(event) {
          resolve(event.target.result);
      };
      reader.onerror = function(event) {
          reject(event.target.error);
      };
      reader.readAsText(file);
  });
}

async function fileSubmit() {
	const fileInput = document.getElementById("file-upload");
	const file = fileInput.files[0];
	if (file) {
		const fileName = file.name;
		const fileExtension = fileName.split(".").pop().toLowerCase();

		const allowedExtensions = ["txt", "pdf"];

		if (allowedExtensions.includes(fileExtension)) {
			if (fileExtension === "txt") {
        const contents = await readTextFile(file);
        display.innerText = contents;
        getResults(contents);
      } else if (fileExtension === "pdf") {
        // alert("Received pdf");
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedArray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedArray).promise.then(function(pdf) {
                let textContent = '';
                const pagesPromises = [];

                for (let i = 1; i <= pdf.numPages; i++) {
                    pagesPromises.push(
                        pdf.getPage(i).then(function(page) {
                            return page.getTextContent().then(function(textContentPage) {
                                const pageText = textContentPage.items.map(item => item.str).join(' ');
                                textContent += pageText + ' ';
                            });
                        })
                    );
                }

                Promise.all(pagesPromises).then(() => {
                  display.innerText = textContent;
                  getResults(textContent);
                });
            });
        };
        fileReader.readAsArrayBuffer(file);
      }
		} else {
			alert("File extension is not allowed. Allowed extensions are .txt and .pdf");
      fileInput.value = "";
		}
	}
}

function logout() {
	chrome.storage.local.remove("apiKey");
	showSetup();
}

function showDashboard() {
	document.getElementById("dashboard").classList.remove("hidden");
	document.getElementById("setup").classList.add("hidden");
}

function showSetup() {
	document.getElementById("dashboard").classList.add("hidden");
	document.getElementById("setup").classList.remove("hidden");
}

function load() {
	chrome.storage.local.get("apiKey").then(function (data) {
		if (typeof data["apiKey"] != "undefined") {
			showDashboard();
			// document.getElementById("apiKey").value = data["apiKey"];
		} else {
			showSetup();
		}
	});
}

/**
 * @returns {Promise<Tab | undefined>} Returns the value of x for the equation.
 */
async function getCurrentTab() {
	let queryOptions = { active: true, lastFocusedWindow: true };
	// `tab` will either be a `tabs.Tab` instance or `undefined`.
	let [tab] = await chrome.tabs.query(queryOptions);
	return tab;
}

/**
 @typedef EventType
 @type {Object}
 @property {string} event The event name.
 @property {Object} [body] The body of the event.
 */

async function onclick() {
	// const display = document.getElementById("display");
	const tab = await getCurrentTab();
	// console.log("current tab", tab);
	await chrome.tabs.sendMessage(tab.id, {
		message: JSON.stringify({
			event: "GET_TEXT",
		}),
	});
}

function getResults(text) {
  chrome.storage.local.get("apiKey").then(function (data) {
		if (typeof data["apiKey"] != "undefined") {
			const apiKey = data["apiKey"];
			fetch("https://api.cohere.com/v1/chat", {
				method: "POST",
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					Authorization: `bearer ${apiKey}`,
				},
				body: JSON.stringify({
					chat_history: [],
					message: `## Instructions
Analyze the provided text to identify and replace non-inclusive language that pertains to humans. Exclude any words referring to inanimate objects. Ensure the overall text is gender-neutral and culturally sensitive. Also ignore text that doesn't relate to pronouns or cultural issues.
Please also ONLY respond in JSON with no markup syntax and external text. Your response must begin with '{' and end with '}'.
The schema of the JSON response and the text is given below:

## Response JSON Schema
schema {
  originalText: string, // the original text
  inclusiveText: string, // the modified inclusive text
  nonInclusiveTexts: Array<{
    text: string, // the part of the text that is not inclusive
    reason: string, // the reason why this part of the text is not inclusive
    replacement: string, // suggested text to replace the not-inclusive text
  }>
}

## Input Text
${text}`,
					prompt_truncation: "OFF",
					connectors: [],
					temperature: 0.3,
					model: "command-r-plus",
				}),
			})
				.then((res) => res.json())
				.then((res) => {
					const obj = JSON.parse(res.text)
					document.getElementById("results").innerText = obj.inclusiveText; 
					//document.getElementById("suggestions").innerText = "Detected Word: " + JSON.stringify(obj.nonInclusiveTexts[0].text) + "\n\n" + "Reason for Change: " + obj.nonInclusiveTexts[0].reason + "\n\n" + "Replacment: " + JSON.stringify(obj.nonInclusiveTexts[0].replacement); 
					//document.getElementById("suggestions").innerText = res.text

					console.log(obj);
					console.log(obj.nonInclusiveTexts);					
					// Get the parent container
					const container = document.getElementById('suggestions-container');
					container.innerHTML =``;
					
					// Function to add divs based on the list
					
					obj.nonInclusiveTexts.forEach(item => {
						// Create a new div element
						const newDiv = document.createElement('div');


						// Add a class for styling
						newDiv.classList.add('rounded-lg', 'bg-white/10', 'px-3', 'py-2', 'text-sm', 'font-medium', 'w-full');
						
						// Set the content of the div
						newDiv.innerHTML = `<strong>Text:</strong> ${item.text}<br><br>
											<strong>Reason:</strong> ${item.reason}<br><br>
											<strong>Replacement:</strong> ${item.replacement || 'N/A'}`;
						
						// Append the new div to the container
						container.appendChild(newDiv);
					});
				});
		} else {
			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				func: () => {
					window.alert("Equill Chrome Ext: Please configure an API Key");
				},
			});
		}
	});
}

chrome.runtime.onMessage.addListener(function (request, sender) {
	// console.log(request.message, sender);
	const event = JSON.parse(request.message);
	if (event.event !== "SELECTED") return;
	const text = event.body;
	// check if the highlighted text is already prompted
	if (display.innerText === text) return;
	display.innerText = text;
	getResults(text);
});

document.addEventListener("DOMContentLoaded", load);
document.getElementById("btn").addEventListener("click", save);
document.getElementById("fn").addEventListener("click", onclick);
document.getElementById("logout").addEventListener("click", logout);
document.getElementById("file-upload").addEventListener("change", fileSubmit);
