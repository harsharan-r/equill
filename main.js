function save(e) {
	e.preventDefault();
	const apiKey = document.getElementById("apiKey").value;
	chrome.storage.local.set({ apiKey }).then(load);
}

function load() {
	chrome.storage.local.get("apiKey").then(function (data) {
		if (typeof data["apiKey"] != "undefined") {
			document.getElementById("apiKey").value = data["apiKey"];
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

async function onclick() {
  const display = document.getElementById("display");
  const tab = await getCurrentTab();
  console.log("current tab", tab)
  await chrome.tabs.sendMessage(tab.id, { message: "TEST" });
}

chrome.runtime.onMessage.addListener(function(request, sender) {
  // console.log(request.message, sender);
  const msg = JSON.parse(request.message);
  display.innerText = msg.text;
});

document.addEventListener("DOMContentLoaded", load);
document.getElementById("frm").addEventListener("submit", save);
document.getElementById("fn").addEventListener("click", onclick);
