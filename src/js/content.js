// Store analyzed elements and observers
let analyzedElements = [];
let isInitialized = false;
let scanTimeout = null;
let messageHandlers = new Set();
let tooltip = null;
let currentHoveredElement = null;
let mutationObserver = null;

// Initialize state synchronization
async function initializeState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getState' });
    if (response && response.isActive) {
      enableHoverInspection();
    }
  } catch (error) {
    console.error('Failed to sync state:', error);
  }
}

// Initialize when the content script loads
initializeState();

// Function to convert pixel value to rem
function pxToRem(pxValue) {
  // Extract numeric value from string (e.g., "16px" -> 16)
  const px = parseFloat(pxValue);
  if (isNaN(px)) return null;
  
  // Convert to rem (16px = 1rem)
  const rem = px / 16;
  
  // Round to 1 decimal place and remove trailing zeros
  return Number(rem.toFixed(1)).toString();
}

// Function to format size value with rem
function formatSizeValue(value) {
  if (!value) return value;
  
  // Handle line-height values that might be unitless
  if (value === 'normal') return value;
  
  // Convert to rem if it's a pixel value
  const rem = pxToRem(value);
  if (rem === null) return value;
  
  return `${value} (${rem}rem)`;
}

// Function to get computed styles for an element
function getComputedStyles(element) {
  const styles = window.getComputedStyle(element);
  return {
    fontFamily: styles.fontFamily,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    lineHeight: styles.lineHeight,
    color: styles.color,
    letterSpacing: styles.letterSpacing,
    textTransform: styles.textTransform,
    fontStyle: styles.fontStyle,
    textAlign: styles.textAlign
  };
}

// Function to format element for results
function formatElementForResults(element) {
  const styles = getComputedStyles(element);
  return {
    tag: element.tagName.toLowerCase(),
    className: element.className || '',
    text: element.textContent.trim().substring(0, 100),
    styles: {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      color: styles.color
    }
  };
}

// Function to check if element is visible
function isVisible(el) {
  if (!el || !el.getBoundingClientRect) return false;
  
  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  
  // More lenient viewport check
  const isInViewport = (
    rect.bottom > -100 && // Allow elements slightly above viewport
    rect.right > -100 &&  // Allow elements slightly left of viewport
    rect.top < window.innerHeight + 100 && // Allow elements slightly below viewport
    rect.left < window.innerWidth + 100    // Allow elements slightly right of viewport
  );

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    parseFloat(style.opacity) > 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    isInViewport
  );
}

// Function to check if element has text
function hasText(el) {
  if (!el) return false;
  
  // Special handling for buttons and inputs
  if (el.tagName === 'BUTTON' || el.tagName === 'INPUT') {
    return el.value || el.textContent || el.innerText || el.placeholder;
  }
  
  // For other elements, check text content
  const text = el.textContent || el.innerText;
  return text && text.trim().length > 0;
}

// Function to check if element is inspectable
function isInspectable(el) {
  if (!el || !el.tagName) return false;

  // Skip certain elements
  const skipTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT'];
  if (skipTags.includes(el.tagName)) return false;

  // Special handling for interactive elements
  const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
  if (interactiveTags.includes(el.tagName)) {
    return isVisible(el) && hasText(el);
  }

  // Skip parent elements that contain interactive elements only if they don't have their own text
  const hasInteractiveChildren = el.querySelector(interactiveTags.join(','));
  if (hasInteractiveChildren && !hasText(el)) return false;

  // For text elements, only check if they're visible and have text
  if (isVisible(el) && hasText(el)) {
    return true;
  }

  return false;
}

// Function to create tooltip
function createTooltip() {
  if (tooltip) {
    tooltip.remove();
  }

  tooltip = document.createElement('div');
  tooltip.className = 'font-checker-tooltip';
  tooltip.style.display = 'none';
  document.body.appendChild(tooltip);
  return tooltip;
}

// Function to show tooltip
function showTooltip(element, event) {
  if (!tooltip) {
    tooltip = createTooltip();
  }

  const styles = getComputedStyles(element);
  tooltip.innerHTML = `
    <div class="tag-row">
      <span class="tag">&lt;${element.tagName.toLowerCase()}&gt;</span>
      <span class="copy-hint">Copy: Shift + 🖱️</span>
    </div>
    <div class="property">
      <span class="property-name">Font Family</span>
      <span class="property-value">
        <div class="font-stack">
          <div class="primary-font">${styles.fontFamily.split(',')[0]}</div>
          <div class="fallback-fonts">${styles.fontFamily}</div>
        </div>
      </span>
    </div>
    <div class="property">
      <span class="property-name">Size</span>
      <span class="property-value">${formatSizeValue(styles.fontSize)}</span>
    </div>
    <div class="property">
      <span class="property-name">Weight</span>
      <span class="property-value">${styles.fontWeight}</span>
    </div>
    <div class="property">
      <span class="property-name">Line Height</span>
      <span class="property-value">${formatSizeValue(styles.lineHeight)}</span>
    </div>
    <div class="property">
      <span class="property-name">Letter Spacing</span>
      <span class="property-value">${formatSizeValue(styles.letterSpacing)}</span>
    </div>
    <div class="property">
      <span class="property-name">Text Transform</span>
      <span class="property-value">${styles.textTransform}</span>
    </div>
    <div class="property">
      <span class="property-name">Font Style</span>
      <span class="property-value">${styles.fontStyle}</span>
    </div>
    <div class="property">
      <span class="property-name">Text Align</span>
      <span class="property-value">${styles.textAlign}</span>
    </div>
    <div class="property">
      <span class="property-name">Color</span>
      <span class="property-value">
        <span class="color-swatch" style="background-color: ${styles.color}"></span>
        ${styles.color}
      </span>
    </div>
  `;

  updateTooltipPosition(event);
  tooltip.style.display = 'block';
}

// Function to update tooltip position
function updateTooltipPosition(event) {
  if (!tooltip) return;

  // Position tooltip near cursor
  const x = event.clientX + 15;
  const y = event.clientY + 15;

  // Ensure tooltip stays within viewport
  const tooltipRect = tooltip.getBoundingClientRect();
  const maxX = window.innerWidth - tooltipRect.width - 10;
  const maxY = window.innerHeight - tooltipRect.height - 10;

  tooltip.style.left = `${Math.min(x, maxX)}px`;
  tooltip.style.top = `${Math.min(y, maxY)}px`;
}

// Function to hide tooltip
function hideTooltip() {
  if (tooltip) {
    tooltip.style.display = 'none';
  }
  currentHoveredElement = null;
}

// Function to check if element is still under cursor
function isElementUnderCursor(element, event) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

// Function to analyze a single element
function analyzeElement(element) {
  if (isInspectable(element)) {
    analyzedElements.push(formatElementForResults(element));
  }
}

// Function to analyze fonts on the page
function analyzeFonts() {
  if (scanTimeout) {
    clearTimeout(scanTimeout);
  }

  // Only analyze in the main frame
  if (window.self !== window.top) {
    return analyzedElements;
  }

  console.log('Analyzing fonts on page...');
  
  // Get all elements in the body
  const allElements = document.body.getElementsByTagName('*');
  analyzedElements = [];

  // Convert HTMLCollection to Array and analyze elements
  Array.from(allElements).forEach(analyzeElement);

  console.log(`Found ${analyzedElements.length} text elements`);
  return analyzedElements;
}

// Function to handle mutations
function handleMutations(mutations) {
  mutations.forEach(mutation => {
    // Handle added nodes
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Analyze the new element
        analyzeElement(node);
        
        // Also analyze any child elements
        const childElements = node.getElementsByTagName('*');
        Array.from(childElements).forEach(analyzeElement);
      }
    });
  });
}

// Function to enable hover inspection
function enableHoverInspection() {
  // Remove existing event listeners
  disableHoverInspection();

  // Add delegated event listeners to document.body
  document.body.addEventListener('mouseenter', handleMouseEnter, true);
  document.body.addEventListener('mouseleave', handleMouseLeave, true);
  document.body.addEventListener('mousemove', handleMouseMove, true);
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Set up mutation observer
  mutationObserver = new MutationObserver(handleMutations);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Function to disable hover inspection
function disableHoverInspection() {
  document.body.removeEventListener('mouseenter', handleMouseEnter, true);
  document.body.removeEventListener('mouseleave', handleMouseLeave, true);
  document.body.removeEventListener('mousemove', handleMouseMove, true);
  window.removeEventListener('scroll', handleScroll);
  
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }
  
  hideTooltip();
}

// Function to handle mouseenter events
function handleMouseEnter(event) {
  const element = event.target;
  if (isInspectable(element)) {
    currentHoveredElement = element;
    showTooltip(element, event);
  }
}

// Function to handle mouseleave events
function handleMouseLeave(event) {
  // Only hide if we're actually leaving the element
  if (currentHoveredElement && !isElementUnderCursor(currentHoveredElement, event)) {
    hideTooltip();
  }
}

// Function to handle mousemove events
function handleMouseMove(event) {
  if (currentHoveredElement) {
    if (isElementUnderCursor(currentHoveredElement, event)) {
      updateTooltipPosition(event);
    } else {
      hideTooltip();
    }
  } else {
    const element = event.target;
    if (isInspectable(element)) {
      currentHoveredElement = element;
      showTooltip(element, event);
    }
  }
}

// Function to handle scroll events
function handleScroll() {
  if (currentHoveredElement && tooltip) {
    // Get the current mouse position
    const event = {
      clientX: tooltip.getBoundingClientRect().left - 15,
      clientY: tooltip.getBoundingClientRect().top - 15
    };
    
    // Check if element is still under cursor
    if (isElementUnderCursor(currentHoveredElement, event)) {
      updateTooltipPosition(event);
    } else {
      hideTooltip();
    }
  }
}

// Function to show a toast notification (supports bottom right for copy)
function showFontCheckerToast(message, state) {
  // Remove any existing toast
  const oldToast = document.querySelector('.font-checker-toast');
  if (oldToast) oldToast.remove();

  const toast = document.createElement('div');
  toast.className = 'font-checker-toast';
  if (state === 'on') toast.classList.add('font-checker-toast-on');
  if (state === 'off') toast.classList.add('font-checker-toast-off');
  if (state === 'copied') toast.classList.add('font-checker-toast-copied');
  toast.textContent = message;
  document.body.appendChild(toast);

  // Force reflow to enable transition
  void toast.offsetWidth;
  toast.classList.add('font-checker-toast-show');

  setTimeout(() => {
    toast.classList.remove('font-checker-toast-show');
    setTimeout(() => toast.remove(), state === 'copied' ? 1500 : 1800);
  }, 1800);
}

// Function to copy computed font CSS to clipboard
function copyFontCSS(element) {
  const styles = getComputedStyles(element);
  const tag = `<${element.tagName.toLowerCase()}>`;
  const className = element.className && element.className.trim() ? `Class: ${element.className.trim()}` : '';
  const text = element.textContent.trim();
  const lines = [tag];
  if (className) {
    lines.push(className, ''); // Add blank line after class
  }
  lines.push(`Text: ${text}`, '');
  lines.push(
    `font-family: ${styles.fontFamily};`,
    `font-size: ${styles.fontSize};`,
    `font-weight: ${styles.fontWeight};`,
    `line-height: ${styles.lineHeight};`,
    `letter-spacing: ${styles.letterSpacing};`,
    `text-transform: ${styles.textTransform};`,
    `font-style: ${styles.fontStyle};`,
    `text-align: ${styles.textAlign};`,
    `color: ${styles.color};`
  );
  const css = lines.join('\n');
  navigator.clipboard.writeText(css).then(() => {
    showFontCheckerToast('✅ CSS copied to clipboard', 'copied');
  });
}

// Listen for Shift+Click on the inspected element
function handleShiftClick(event) {
  if (event.shiftKey && event.button === 0 && currentHoveredElement && event.target === currentHoveredElement) {
    event.preventDefault();
    copyFontCSS(currentHoveredElement);
  }
}
document.addEventListener('mousedown', handleShiftClick, true);

// Function to handle messages
function handleMessage(request, sender, sendResponse) {
  // Only handle messages in the main frame
  if (window.self !== window.top) {
    return;
  }

  console.log('Received message:', request.action);
  if (request.action === 'getResults') {
    sendResponse({ results: analyzedElements });
  } else if (request.action === 'showOverlays') {
    enableHoverInspection();
    showFontCheckerToast('Font Checker ON', 'on');
    sendResponse({ success: true });
  } else if (request.action === 'removeOverlays') {
    disableHoverInspection();
    showFontCheckerToast('Font Checker OFF', 'off');
    sendResponse({ success: true });
  }
}

// Initialize the content script
function initialize() {
  // Only initialize in the main frame
  if (window.self !== window.top) {
    return;
  }

  if (isInitialized) {
    return;
  }
  isInitialized = true;

  console.log('Content script loaded');
  analyzeFonts();

  // Add message listener if not already added
  if (!messageHandlers.has(handleMessage)) {
    chrome.runtime.onMessage.addListener(handleMessage);
    messageHandlers.add(handleMessage);
  }
}

// Start initialization
initialize(); 