chrome.runtime.onInstalled.addListener(() =>
	chrome.contextMenus.create({
		title: "Make text more inclusive",
		contexts: ["selection"],
		id: "ContextMenuId",
	})
);



chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));



chrome.contextMenus.onClicked.addListener((info, tab) => {
	const text = info.selectionText;
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
                    Please output in JSON format, an object that includes all the "non-inclusive" texts, a reason for why the text is non-inclusive, and what to replace that portion with. Please also include the character index and the length of replacement. Ensure the overall text is gender neutral. Also replace anything that is culturally offensive. The text is below
                    
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
					chrome.scripting.executeScript({
						target: { tabId: tab.id },
						func: (text) => {
							window.alert(text);
						},
						args: [res.text],
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
});
