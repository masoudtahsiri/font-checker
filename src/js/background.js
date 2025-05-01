// Track the active state for each tab
const activeTabs = new Map();

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  // Get the current state for this tab
  const isActive = activeTabs.get(tab.id) || false;
  
  // Toggle the state
  activeTabs.set(tab.id, !isActive);
  
  // Send message to content script
  await chrome.tabs.sendMessage(tab.id, {
    action: isActive ? 'removeOverlays' : 'showOverlays'
  });
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  activeTabs.delete(tabId);
}); 