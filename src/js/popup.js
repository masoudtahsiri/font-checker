document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const tagFilter = document.getElementById('tagFilter');
  const fontTableBody = document.getElementById('fontTableBody');
  
  let currentResults = [];

  // Function to update the tag filter options
  function updateTagFilter(results) {
    const tags = [...new Set(results.map(r => r.tag))];
    tagFilter.innerHTML = '<option value="all">All Tags</option>' +
      tags.map(tag => `<option value="${tag}">${tag}</option>`).join('');
  }

  // Function to filter results
  function filterResults() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedTag = tagFilter.value;

    return currentResults.filter(result => {
      const matchesSearch = result.text.toLowerCase().includes(searchTerm) ||
                          result.className.toLowerCase().includes(searchTerm);
      const matchesTag = selectedTag === 'all' || result.tag === selectedTag;
      return matchesSearch && matchesTag;
    });
  }

  // Function to display results
  function displayResults(results) {
    fontTableBody.innerHTML = '';
    
    if (!results || results.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="7" class="no-results">No elements found</td>';
      fontTableBody.appendChild(row);
      return;
    }
    
    results.forEach(result => {
      if (!result || !result.styles) {
        console.warn('Invalid result:', result);
        return;
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${result.tag || ''}</td>
        <td>${result.className || ''}</td>
        <td>${result.text || ''}</td>
        <td>${result.styles.fontFamily || ''}</td>
        <td>${result.styles.fontSize || ''}</td>
        <td>${result.styles.fontWeight || ''}</td>
        <td>${result.styles.color || ''}</td>
      `;
      
      fontTableBody.appendChild(row);
    });
  }

  // Function to update results
  function updateResults() {
    const filteredResults = filterResults();
    displayResults(filteredResults);
  }

  // Add event listeners
  searchInput.addEventListener('input', updateResults);
  tagFilter.addEventListener('change', updateResults);

  // Show overlays and get results when popup opens
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    
    // Show overlays
    chrome.tabs.sendMessage(activeTab.id, { action: 'showOverlays' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error showing overlays:', chrome.runtime.lastError);
        return;
      }
      
      // Get results
      chrome.tabs.sendMessage(activeTab.id, { action: 'getResults' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting results:', chrome.runtime.lastError);
          return;
        }
        
        if (response && response.results) {
          currentResults = response.results;
          updateTagFilter(currentResults);
          updateResults();
        }
      });
    });
  });
}); 