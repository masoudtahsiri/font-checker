// Track the active state for each tab using chrome.storage.local
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get the current state for this tab
    const result = await chrome.storage.local.get(`tab_${tab.id}`);
    const isActive = result[`tab_${tab.id}`] || false;
    
    // Toggle the state
    await chrome.storage.local.set({ [`tab_${tab.id}`]: !isActive });
    
    // Try to send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: isActive ? 'removeOverlays' : 'showOverlays'
      });
    } catch {
      // If content script isn't ready, inject it and show reload message
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const toast = document.createElement('div');
          toast.className = 'font-checker-toast font-checker-toast-reload';
          toast.textContent = 'Please reload the page to use PeekFont';
          document.body.appendChild(toast);
          
          // Force reflow to enable transition
          void toast.offsetWidth;
          toast.classList.add('font-checker-toast-show');
          
          setTimeout(() => {
            toast.classList.remove('font-checker-toast-show');
            setTimeout(() => toast.remove(), 300);
          }, 3000);
        }
      });
    }
  } catch {
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