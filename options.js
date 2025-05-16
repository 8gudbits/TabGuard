// options.js

document
  .getElementById("urlInput")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      document.getElementById("addButton").click();
    }
  });

document.addEventListener("DOMContentLoaded", function () {
  const urlInput = document.getElementById("urlInput");
  const addButton = document.getElementById("addButton");
  const blockedList = document.getElementById("blockedList");

  // Load saved blocked sites
  function loadBlockedSites() {
    chrome.storage.local.get(["blockedSites"], function (result) {
      blockedList.innerHTML = ""; // Clear list before rendering
      if (result.blockedSites) {
        result.blockedSites.forEach((site) => addUrlToList(site));
      }
    });
  }

  // Validate input URL
  function isValidUrl(url) {
    try {
      new URL(url.startsWith("http") ? url : `https://${url}`);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Add URL to list and storage with dynamic truncation
  function addUrlToList(url) {
    const listItem = document.createElement("li");
    listItem.classList.add("url-item");

    const urlSpan = document.createElement("span");
    urlSpan.className = "url-text";
    urlSpan.textContent = url;
    urlSpan.title = url; // Show full URL on hover

    const removeBtn = document.createElement("button");
    removeBtn.className = "removeButton";
    removeBtn.textContent = "Remove";
    removeBtn.dataset.url = url;

    listItem.appendChild(urlSpan);
    listItem.appendChild(removeBtn);
    blockedList.appendChild(listItem);

    // Adjust truncation on window resize
    window.addEventListener("resize", function () {
      adjustUrlDisplay(urlSpan);
    });

    // Initial adjustment
    adjustUrlDisplay(urlSpan);
  }

  // Dynamically adjust URL display based on available space
  function adjustUrlDisplay(element) {
    // Temporarily show full text to measure width
    element.style.textOverflow = "clip";
    element.style.overflow = "visible";
    element.style.whiteSpace = "nowrap";

    const fullWidth = element.scrollWidth;
    const availableWidth = element.parentElement.offsetWidth - 100; // Space for button

    // Restore ellipsis if needed
    element.style.textOverflow = "ellipsis";
    element.style.overflow = "hidden";

    // Show tooltip only if text is truncated
    element.title = fullWidth > availableWidth ? element.textContent : "";
  }

  // Handle adding a new blocked site
  addButton.addEventListener("click", function () {
    let url = urlInput.value.trim();

    // Add https:// if not present
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    if (!isValidUrl(url)) {
      return; // Simply return if the URL is invalid
    }

    chrome.storage.local.get(["blockedSites"], function (result) {
      let blockedSites = result.blockedSites || [];

      if (blockedSites.includes(url)) {
        return; // Return if the URL is already blocked
      }

      blockedSites.push(url);
      chrome.storage.local.set({ blockedSites }, function () {
        if (chrome.runtime.lastError) {
          return; // Handle error silently
        }
        addUrlToList(url);
        urlInput.value = ""; // Clear input after adding
        urlInput.focus(); // Focus back on input
      });
    });
  });

  // Handle removing a blocked site
  blockedList.addEventListener("click", function (event) {
    if (event.target.classList.contains("removeButton")) {
      const urlToRemove = event.target.getAttribute("data-url");
      chrome.storage.local.get(["blockedSites"], function (result) {
        let blockedSites = result.blockedSites.filter(
          (site) => site !== urlToRemove
        );
        chrome.storage.local.set({ blockedSites }, function () {
          if (chrome.runtime.lastError) {
            return; // Handle error silently
          }
          loadBlockedSites(); // Refresh list after deletion
        });
      });
    }
  });

  // Load stored sites on page load
  loadBlockedSites();
});
