function save(e) {
    e.preventDefault();
    const apiKey = document.getElementById("apiKey").value;
    chrome.storage.local.set({ apiKey }).then(load);
  }

  function load() {
    chrome.storage.local.get("apiKey").then(function(data) {
      if (typeof data["apiKey"] != "undefined") {
        document.getElementById("apiKey").value = data["apiKey"];
      }
    });
  }

  document.addEventListener("DOMContentLoaded", load);
  document.getElementById("frm").addEventListener("submit", save);