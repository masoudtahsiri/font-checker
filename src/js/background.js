// Track the active state for each tab using chrome.storage.local
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get the current state for this tab
    const result = await chrome.storage.local.get(`tab_${tab.id}`);
    const isActive = result[`tab_${tab.id}`] || false;
    
    // Toggle the state
    await chrome.storage.local.set({ [`tab_${tab.id}`]: !isActive });
    
    // Send message to content script
    await chrome.tabs.sendMessage(tab.id, {
      action: isActive ? 'removeOverlays' : 'showOverlays'
    });
  } catch (error) {
    console.error('Error handling extension click:', error);
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    await chrome.storage.local.remove(`tab_${tabId}`);
  } catch (error) {
    console.error('Error cleaning up tab state:', error);
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getState') {
    // Get state from storage and send it back
    chrome.storage.local.get(`tab_${sender.tab.id}`, (result) => {
      sendResponse({ isActive: result[`tab_${sender.tab.id}`] || false });
    });
    return true; // Required for async sendResponse
  }
}); 