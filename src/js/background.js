// Track the active state for each tab using chrome.storage.local
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get the current state for this tab
    const result = await chrome.storage.local.get(`tab_${tab.id}`);
    const isActive = result[`tab_${tab.id}`] || false;
    
    // Toggle the state
    await chrome.storage.local.set({ [`tab_${tab.id}`]: !isActive });
    
    // Try to send message to content script, but don't throw if it fails
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: isActive ? 'removeOverlays' : 'showOverlays'
      });
    } catch {
      // Silently ignore if content script isn't ready
    }
  } catch (error) {
    // Silently ignore any other errors
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    await chrome.storage.local.remove(`tab_${tabId}`);
  } catch {
    // Silently ignore cleanup errors
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