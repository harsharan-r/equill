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
	console.log(request.message, sender);
	chrome.runtime.sendMessage({
		message: JSON.stringify({
			event: "SELECTED",
			body: getSelectedText(),
		}),
	});
});
