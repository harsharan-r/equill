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

chrome.runtime.onMessage.addListener(function (request, sender) {
	// console.log(request.message, sender);
	const event = JSON.parse(request.message);
	if (event.event !== "SELECTED") return;
  const text = event.body;
  // check if the highlighted text is already prompted
  if (display.innerText === text) return;
	display.innerText = text;
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
					document.getElementById("results").innerText = res.text;
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
});

document.addEventListener("DOMContentLoaded", load);
document.getElementById("btn").addEventListener("click", save);
document.getElementById("fn").addEventListener("click", onclick);
document.getElementById("logout").addEventListener("click", logout);
