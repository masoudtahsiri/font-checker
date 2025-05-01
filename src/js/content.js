// Store analyzed elements and observers
let analyzedElements = [];
let isInitialized = false;
let scanTimeout = null;
let messageHandlers = new Set();
let tooltip = null;
let currentHoveredElement = null;
let mutationObserver = null;

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
    fontStyle: styles.fontStyle
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
    return el.value || el.textContent || el.innerText;
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

  // For text elements, only check if they're visible and have text
  if (isVisible(el) && hasText(el)) {
    // Don't skip if parent has text - this allows nested text elements
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
    <span class="tag">&lt;${element.tagName.toLowerCase()}&gt;</span>
    <div class="property">
      <span class="property-name">Font Family</span>
      <span class="property-value">${styles.fontFamily.split(',')[0]}</span>
    </div>
    <div class="property">
      <span class="property-name">Size</span>
      <span class="property-value">${styles.fontSize}</span>
    </div>
    <div class="property">
      <span class="property-name">Weight</span>
      <span class="property-value">${styles.fontWeight}</span>
    </div>
    <div class="property">
      <span class="property-name">Line Height</span>
      <span class="property-value">${styles.lineHeight}</span>
    </div>
    <div class="property">
      <span class="property-name">Color</span>
      <span class="property-value">${styles.color}</span>
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
    sendResponse({ success: true });
  } else if (request.action === 'removeOverlays') {
    disableHoverInspection();
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