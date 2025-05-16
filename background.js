// background.js

chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.alarms.create("keepAlive", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keepAlive") {
    console.log("Service worker alive");
  }
});

async function updateBlockRules() {
  // First remove ALL existing rules from previous updates
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);

  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
    });
  }

  // Then add new rules based on current blocked sites
  const result = await chrome.storage.local.get(["blockedSites"]);
  const blockedSites = result.blockedSites || [];

  const rules = blockedSites
    .map((url, index) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
      } catch (e) {
        console.error(`Invalid URL: ${url}`);
        return null;
      }

      let domain = `${parsedUrl.hostname}/*`;

      return {
        id: index + 1,
        priority: 1,
        action: { type: "block" },
        condition: {
          urlFilter: domain,
          resourceTypes: [
            "main_frame",
            "sub_frame",
            "script",
            "stylesheet",
            "image",
            "xmlhttprequest",
            "other",
          ],
        },
      };
    })
    .filter((rule) => rule !== null); // Filter out any invalid URLs

  if (rules.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
    });
  }
}

chrome.storage.onChanged.addListener(function (changes) {
  if (changes.blockedSites) {
    updateBlockRules();
  }
});

chrome.runtime.onStartup.addListener(updateBlockRules);
chrome.runtime.onInstalled.addListener(updateBlockRules);
