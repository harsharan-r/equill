let globalStorage = {
	apiKey: "",
	country: "International",
	religion: "Not Specified",
	language: "en-US",
	seed: 0,
	temperature: 0.3
};

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
				globalStorage.apiKey = apiKey;
				msg.classList.add("max-h-0", "opacity-0", "hidden");
				msg.classList.remove("max-h-40", "opacity-100", "flex");
			} else {
				msg.classList.remove("max-h-0", "opacity-0", "hidden");
				msg.classList.add("max-h-40", "opacity-100", "flex");
			}
		});
}

function readTextFile(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = function (event) {
			resolve(event.target.result);
		};
		reader.onerror = function (event) {
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
				fileReader.onload = function () {
					const typedArray = new Uint8Array(this.result);
					pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
						let textContent = "";
						const pagesPromises = [];

						for (let i = 1; i <= pdf.numPages; i++) {
							pagesPromises.push(
								pdf.getPage(i).then(function (page) {
									return page.getTextContent().then(function (textContentPage) {
										const pageText = textContentPage.items.map((item) => item.str).join(" ");
										textContent += pageText + " ";
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

function toggleSettings() {
	if (document.getElementById("main-body").classList.contains("hidden")) {
		document.getElementById("main-body").classList.remove("hidden");
		document.getElementById("settings").classList.add("hidden");
	} else {
		document.getElementById("main-body").classList.add("hidden");
		document.getElementById("settings").classList.remove("hidden");
	}
}

function logout() {
	chrome.storage.local.remove("apiKey");
	showSetup();
}

function showDashboard() {
	document.getElementById("dashboard").classList.remove("hidden");
	document.getElementById("dashboard").classList.add("flex");
	document.getElementById("setup").classList.remove("flex");
	document.getElementById("setup").classList.add("hidden");
}

function showSetup() {
	document.getElementById("dashboard").classList.add("hidden");
	document.getElementById("dashboard").classList.remove("flex");
	document.getElementById("setup").classList.remove("hidden");
	document.getElementById("setup").classList.add("flex");
}

function load() {
	document.getElementById("tempDisplay").innerText = 0.3;

	chrome.storage.local.get("apiKey").then(function (data) {
		if (typeof data["apiKey"] != "undefined") {
			globalStorage.apiKey = data["apiKey"];
			showDashboard();
			// document.getElementById("apiKey").value = data["apiKey"];
		} else {
			showSetup();
		}
	});
	chrome.storage.local.get("country").then(function (data) {
		globalStorage.country = data["country"];
		document.getElementById("country").value = data["country"];
	});
	chrome.storage.local.get("religion").then(function (data) {
		globalStorage.religion = data["religion"];
		document.getElementById("religion").value = data["religion"];
	});
	chrome.storage.local.get("language").then(function (data) {
		globalStorage.language = data["language"];
		document.getElementById("language").value = data["language"];
	})
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

function getPrompt(language, country, religion) {
	if (language === "en-US" && country === "International" && religion === "Not Specified") {
		return "Analyze the provided text to identify and replace non-inclusive language that pertains to humans. Exclude any words referring to inanimate objects. Ensure the overall text is gender-neutral and culturally sensitive. Also ignore text that doesn't relate to pronouns or cultural issues.";
	}

	let prompt = `Generate an inclusive version of the following text, ensuring it's free from gender-biased${
		religion !== "Not Specified" && (language !== "en-US" || country !== "International")
			? ", culturally insensitive, and religiously"
			: religion !== "Not Specified"
			? " and religiously"
			: " and culturally"
	} insensitive language to `;

	let additionalClauses = [];

	if (religion !== "Not Specified") {
		additionalClauses.push(
			`people who believe in ${religion}`
		);
	}

	if (language !== "en-US") {
		additionalClauses.push(
			`people who speak the language with locale ${language}`
		);
	}

	if (country !== "International") {
		additionalClauses.push(`people in ${country}`);
	}

	prompt += additionalClauses.join(' and ') + ". Assume this message is being sent to ";

	additionalClauses = [];

	if (religion !== "Not Specified") {
		additionalClauses.push(
			`someone very religious, practicing ${religion}`
		);
	}

	if (language !== "en-US") {
		additionalClauses.push(
			`someone who speaks the language with locale ${language}`
		);
	}

	if (country !== "International") {
		additionalClauses.push(`someone in ${country}`);
	}

	prompt += additionalClauses.join(' or ') + `. If there is an [action] and [task or activity] replace it with a specific, more ${
		religion !== "Not Specified" && (language !== "en-US" || country !== "International")
		? "culturally and religiously"
		: religion !== "Not Specified"
		? "religiously"
		: "culturally"
	} approriate [task or activity]. ${country !== "International" ? `Consider laws in ${country} that prohibt certain activites such as drinking or dancing.` : ""}`;

	prompt += "Exclude any words referring to inanimate objects. Ensure the overall text is gender-neutral and culturally sensitive. Also ignore text that doesn't relate to pronouns or cultural issues.";

	if (language !== "en-US") {
		prompt += ` Finally, please read the text and modify your response in the language locale ${language}. Do not return the text in en-US style.`;
	}

	// console.log("prompt", prompt);
	return prompt;
}

function getResults(text) {
	const apiKey = globalStorage.apiKey;
	if (apiKey === "") return;
	document.getElementById("loading-overlay").classList.remove("hidden");
	document.getElementById("spinner").classList.remove("hidden");
	document.getElementById("score").innerText = "";
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
${getPrompt(globalStorage.language, globalStorage.country, globalStorage.religion)}
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
			temperature: globalStorage.temperature,
			seed: globalStorage.seed === 0 ? undefined : globalStorage.seed,
			model: "command-r-plus",
		}),
	})
		.then((res) => res.json())
		.then((res) => {
			// console.log(res);
			const obj = JSON.parse(res.text);
			document.getElementById("results").innerText = obj.inclusiveText;
			//document.getElementById("suggestions").innerText = "Detected Word: " + JSON.stringify(obj.nonInclusiveTexts[0].text) + "\n\n" + "Reason for Change: " + obj.nonInclusiveTexts[0].reason + "\n\n" + "Replacment: " + JSON.stringify(obj.nonInclusiveTexts[0].replacement);
			//document.getElementById("suggestions").innerText = res.text

			// console.log(obj);
			// console.log(obj.nonInclusiveTexts);

			const container = document.getElementById("suggestions-container");
			container.innerHTML = ``;

			let highlightedOriginal = obj.originalText;
			let highlightedFinal = obj.originalText;
			let highlightedResult = obj.inclusiveText;

			obj.nonInclusiveTexts.forEach((item, index) => {
				const newDiv = document.createElement("div");

				newDiv.classList.add("rounded-lg", "bg-white/10", "px-3", "py-2", "text-sm", "font-medium", "w-full");

				const originalHighlight = `<span id="equill-sp-${index}" class="highlight-original" data-original="${item.text}" data-replacement="${item.replacement || item.text}">${item.text}</span>`;
				const finalHighlight = `<span class="highlight-final">${item.replacement}</span>`;

				highlightedOriginal = highlightedFinal.replace(item.text, originalHighlight);
				highlightedFinal = highlightedFinal.replace(item.text, item.replacement);
				highlightedResult = highlightedResult.replace(item.replacement, finalHighlight);

				newDiv.innerHTML = `<strong>Text:</strong> ${highlightedOriginal}<br><br>
											<strong>Reason:</strong> ${item.reason}<br><br>
											<strong>Replacement:</strong> ${item.replacement || "N/A"}`;

				container.appendChild(newDiv);

				// console.log(item, document.getElementById(`equill-sp-${index}`));
				if (document.getElementById(`equill-sp-${index}`) !== null) {
					document.getElementById(`equill-sp-${index}`).addEventListener("mouseenter", hoverIn);
					document.getElementById(`equill-sp-${index}`).addEventListener("mouseleave", hoverOut);
				}
			});

			document.getElementById("results").innerHTML = highlightedResult;

			if (obj.nonInclusiveTexts.length === 0) {
				container.innerHTML = `<div id="suggestions" class="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium w-full">No suggestions.</div>`;
			}

			document.getElementById("loading-overlay").classList.add("hidden");

			fetch("https://api.cohere.com/v1/chat", {
				method: "POST",
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					Authorization: `bearer ${apiKey}`,
				},
				body: JSON.stringify({
					chat_history: res.chat_history,
					message: `Assuming that the user starts off with a 100. Only remove 2 points for every value in the array. Based on the original text, give a rating based from 1-100 on the inclusivity of the input. For example, if there are 3 instances where text had to be replaced give it a score of 92.Please only output a single number ranging 1-100.`,
					prompt_truncation: "OFF",
					connectors: [],
					temperature: 0.3,
					model: "command-r-plus",
				}),
			})
				.then((res) => res.json())
				.then((res) => {
					// alert("Your score is " + res.text);
					document.getElementById("score").innerText = res.text;
					document.getElementById("spinner").classList.add("hidden");
				});
		});
}

chrome.runtime.onMessage.addListener(function (request, sender) {
	// console.log(request.message, sender);
	console.log(request.message);
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
// document.getElementById("logout").addEventListener("click", test);
document.getElementById("cohere").addEventListener("click", gotoCohere);
document.getElementById("file-upload").addEventListener("change", fileSubmit);
document.getElementById("settings-toggle").addEventListener("click", toggleSettings);
document.getElementById("country").addEventListener("change", changeCountry);
document.getElementById("religion").addEventListener("change", changeReligion);
document.getElementById("language").addEventListener("change", changeLanguage);

document.getElementById("seed").addEventListener("change", changeSeed);
document.getElementById("temperature").addEventListener("change", changeTemperature);

function test() {
	chrome.tabs.create({
		url: "main.html"
	});
}

function gotoCohere() {
	chrome.tabs.create({
		url: "https://dashboard.cohere.com/api-keys"
	});
}

function changeSeed(e) {
	globalStorage.seed = e.target.value;
}

function changeTemperature(e) {
	document.getElementById("tempDisplay").innerText = e.target.value;
	globalStorage.temperature = e.target.value;
}

function changeCountry(e) {
	chrome.storage.local.set({ country: e.target.value }).then(() => {
		globalStorage.country = e.target.value;
	});
}

function changeReligion(e) {
	chrome.storage.local.set({ religion: e.target.value }).then(() => {
		globalStorage.religion = e.target.value;
	});
}

function changeLanguage(e) {
	chrome.storage.local.set({ language: e.target.value }).then(() => {
		globalStorage.language = e.target.value;
	});
}

function hoverIn() {
	const replacementText = this.getAttribute("data-replacement");
	this.classList.remove("highlight-original");
	this.classList.add("highlight-final");
	this.innerText = replacementText;
}

function hoverOut() {
	const originalText = this.getAttribute("data-original");
	this.classList.add("highlight-original");
	this.classList.remove("highlight-final");
	this.innerText = originalText;
}
