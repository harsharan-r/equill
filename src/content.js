function getSelectedText() {
	let selectedText = "";

	if (window.getSelection) {
		selectedText = window.getSelection().toString();
	} else if (document.selection && document.selection.type !== "Control") {
		selectedText = document.selection.createRange().text;
	}

	return selectedText;
}

/**
 @typedef EventType
 @type {Object}
 @property {string} event The event name.
 @property {Object} [body] The body of the event.
 */

chrome.runtime.onMessage.addListener(function (request, sender) {
	// console.log(request.message, sender);
	chrome.runtime.sendMessage({
		message: JSON.stringify({
			event: "SELECTED",
			body: getSelectedText(),
		}),
	});
});

// let textboxes = [];

// function arraysEqual(a, b) {
// 	if (a === b) return true;
// 	if (a == null || b == null) return false;
// 	if (a.length !== b.length) return false;

// 	for (var i = 0; i < a.length; ++i) {
// 	  if (a[i] !== b[i]) return false;
// 	}
// 	return true;
//   }

function isVisible(element) {
	return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

function getEnabledVisibleTextareas() {
	return [...document.querySelectorAll("textarea:not([disabled])")].filter(isVisible);
}

let textareas = getEnabledVisibleTextareas();
// console.log("Initial textareas:", textareas);

let cohereTimeout;

function txtChange(e) {
	if (cohereTimeout) clearTimeout(cohereTimeout);
	cohereTimeout = setTimeout(() => {
		chrome.runtime.sendMessage({
			message: JSON.stringify({
				event: "SELECTED",
				body: e.target.value,
			}),
		});
	}, 2000);
}

function updateTextareas() {
	const oldTextareas = textareas;
	textareas = getEnabledVisibleTextareas();
	// console.log("Updated textareas:", textareas);
	oldTextareas.forEach((ele) => {
		ele.removeEventListener("input", txtChange);
	});
	textareas.forEach((ele) => {
		if (!ele) return;
		ele.addEventListener("input", txtChange);
	});
}

const observerCallback = (mutationsList, observer) => {
	updateTextareas();
};

const observer = new MutationObserver(observerCallback);

document.addEventListener("DOMContentLoaded", () => {
	observer.observe(document.body, { attributes: true, childList: true, subtree: true });
});

// document.getElementById("addTextarea").addEventListener("click", () => {
// 	const newTextarea = document.createElement("textarea");
// 	newTextarea.placeholder = "Newly Added Textarea";
// 	document.body.appendChild(newTextarea);
// 	updateTextareas();
// });

// document.addEventListener("DOMContentLoaded", () => {
// 	textboxes = [...document.querySelectorAll("textarea:not([disabled])")];
// 	console.log("query", textboxes);
// 	textboxes.forEach((ele) => {
// 		ele.addEventListener("change", (e) => {
// 			console.log(e.target.value);
// 		});
// 	});
// });

// setInterval(() => {
// 	let oldTextboxes = textboxes;
// 	textboxes = [...document.querySelectorAll("textarea:not([disabled]), [contenteditable='true'][role='textbox']")];
// 	console.log(textboxes);
// 	if (!arraysEqual(textboxes, oldTextboxes)) {
// 		oldTextboxes.forEach((i) => {
// 			i.removeEventListener("input");
// 		});
// 		textboxes.forEach((i) => {
// 			i.addEventListener("input", (e) => {
// 				alert(e.target.innerText);
// 			})
// 		});
// 		// console.log(textboxes);
// 	}
// }, 100);
