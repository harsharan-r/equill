chrome.runtime.onInstalled.addListener(() =>
	chrome.contextMenus.create({
		title: "Make text more inclusive",
		contexts: ["selection"],
		id: "EquillCtxId",
	})
);

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => console.error(error));

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "EquillCtxId") {
        chrome.sidePanel.open({ windowId: tab.windowId }, function () {
            setTimeout(() => {
                chrome.runtime.sendMessage({
                    message: JSON.stringify({
                        event: "SELECTED",
                        body: info.selectionText,
                    }),
                });
            }, 100);
        });
    }
});
