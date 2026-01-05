// Aletheia Popup Script
// Manages settings and displays statistics

// Load and display statistics
async function loadStats() {
  const stats = await chrome.storage.local.get(['imagesChecked', 'credentialsFound']);

  const imagesChecked = stats.imagesChecked || 0;
  const credentialsFound = stats.credentialsFound || 0;
  const successRate = imagesChecked > 0
    ? ((credentialsFound / imagesChecked) * 100).toFixed(1)
    : 0;

  document.getElementById('imagesChecked').textContent = imagesChecked;
  document.getElementById('credentialsFound').textContent = credentialsFound;
  document.getElementById('successRate').textContent = `${successRate}%`;
}

// Load and display settings
async function loadSettings() {
  const settings = await chrome.storage.local.get(['showNoCredentials']);
  const showNoCredentials = settings.showNoCredentials || false;

  document.getElementById('showNoCredentials').checked = showNoCredentials;
}

// Save settings when changed
document.getElementById('showNoCredentials').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ showNoCredentials: e.target.checked });
  console.log('Setting saved:', e.target.checked);
});

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadSettings();
});
