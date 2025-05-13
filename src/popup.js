const unsupportedSites = [
  /chrome\.google\.com/,
  /webstore\.google\.com/,
  // Add more patterns as needed
];

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  const url = tabs[0].url;
  const isUnsupported = unsupportedSites.some(re => re.test(url));
  const messageDiv = document.getElementById('message');
  if (isUnsupported) {
    messageDiv.innerHTML = `
      <div class="warning">
        <b>Site Not Supported</b><br>
        For technical reasons, PeekFont does not work on this website.
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div>
        <b>PeekFont is ready!</b><br>
        Hover over text to inspect fonts.
      </div>
    `;
  }
}); 