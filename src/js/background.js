// Helper to set icon with opacity
async function setIconWithOpacity(tabId, opacity) {
  const iconUrl = chrome.runtime.getURL('icons/icon48.png');
  const response = await fetch(iconUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(48, 48);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 48, 48);
  
  // Set global alpha for the entire icon
  ctx.globalAlpha = opacity;
  ctx.drawImage(bitmap, 0, 0, 48, 48);

  const imageData = ctx.getImageData(0, 0, 48, 48);
  chrome.action.setIcon({ imageData, tabId });
}

// Helper to set the original icon (full opacity)
async function setOriginalIcon(tabId) {
  setIconWithOpacity(tabId, 1.0);
}

// Helper to set the greyed out icon
function setGreyedOutIcon(tabId) {
  setIconWithOpacity(tabId, 0.5);
}

// Track the active state for each tab using chrome.storage.local
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Get the current state for this tab
    const result = await chrome.storage.local.get(`tab_${tab.id}`);
    const isActive = result[`tab_${tab.id}`] || false;
    
    // Toggle the state
    const newState = !isActive;
    await chrome.storage.local.set({ [`tab_${tab.id}`]: newState });
    
    // Update icon based on new state
    if (newState) {
      setOriginalIcon(tab.id); // Full opacity (ON)
    } else {
      setGreyedOutIcon(tab.id); // Greyed out (OFF)
    }
    
    // Try to send message to content script
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: newState ? 'showOverlays' : 'removeOverlays'
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

// Always set the greyed out icon by default for new tabs
chrome.tabs.onCreated.addListener((tab) => {
  setGreyedOutIcon(tab.id);
});

// Set the icon for all tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.local.get(`tab_${tabId}`).then((result) => {
    const isActive = result[`tab_${tabId}`] || false;
    if (isActive) {
      setOriginalIcon(tabId); // Full opacity (ON)
    } else {
      setGreyedOutIcon(tabId); // Greyed out (OFF)
    }
  });
});

const unsupportedSites = [
  /chrome\.google\.com/,
  /webstore\.google\.com/,
  // Add more patterns as needed
];

// Dynamically set popup for unsupported sites
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    const url = tab.url || '';
    const isUnsupported = unsupportedSites.some(re => re.test(url));
    if (isUnsupported) {
      chrome.action.setPopup({ tabId: tab.id, popup: 'popup.html' });
    } else {
      chrome.action.setPopup({ tabId: tab.id, popup: '' });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    const url = tab.url || '';
    const isUnsupported = unsupportedSites.some(re => re.test(url));
    if (isUnsupported) {
      chrome.action.setPopup({ tabId, popup: 'popup.html' });
    } else {
      chrome.action.setPopup({ tabId, popup: '' });
    }
  }
}); 