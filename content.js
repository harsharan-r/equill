function getSelectedText() {
	let selectedText = "";

	if (window.getSelection) {
		selectedText = window.getSelection().toString();
	} else if (document.selection && document.selection.type !== "Control") {
		selectedText = document.selection.createRange().text;
	}

	return selectedText;
}

chrome.runtime.onMessage.addListener(function (request, sender) {
	console.log(request.message, sender);
	chrome.runtime.sendMessage({
		message: JSON.stringify({
			text: getSelectedText(),
		}),
	});
});
