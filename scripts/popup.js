// Popup script for Family Privacy Extension
class PopupManager {
  constructor() {
    this.currentTab = null;
    this.currentProfile = null;
    this.init();
  }

  async init() {
    await this.getCurrentTab();
    await this.loadCurrentProfile();
    await this.loadProfiles();
    await this.updateSiteStatus();
    await this.loadStatistics();
    await this.loadRecentActivity();
    this.bindEvents();
  }

  async getCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      
      if (tab.url) {
        const url = new URL(tab.url);
        document.getElementById('currentDomain').textContent = url.hostname;
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
      document.getElementById('currentDomain').textContent = 'Unknown';
    }
  }

  async loadCurrentProfile() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCurrentProfile' });
      this.currentProfile = response;
    } catch (error) {
      console.error('Error loading current profile:', error);
    }
  }

  async loadProfiles() {
    try {
      const result = await chrome.storage.local.get(['profiles', 'currentProfile']);
      const profileSelect = document.getElementById('profileSelect');
      
      profileSelect.innerHTML = '';
      
      if (result.profiles && result.profiles.length > 0) {
        result.profiles.forEach(profile => {
          const option = document.createElement('option');
          option.value = profile.id;
          option.textContent = profile.name;
          option.selected = profile.id === result.currentProfile;
          profileSelect.appendChild(option);
        });
      } else {
        const option = document.createElement('option');
        option.textContent = 'No profiles found';
        profileSelect.appendChild(option);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  }

  async updateSiteStatus() {
    const statusElement = document.getElementById('siteStatus');
    
    if (!this.currentTab || !this.currentTab.url) {
      statusElement.textContent = 'Unknown';
      statusElement.className = 'status-badge checking';
      return;
    }

    try {
      const url = new URL(this.currentTab.url);
      
      // Skip chrome:// and extension pages
      if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
        statusElement.textContent = 'System Page';
        statusElement.className = 'status-badge allowed';
        return;
      }

      const response = await chrome.runtime.sendMessage({
        action: 'checkSiteStatus',
        domain: url.hostname
      });

      if (response.status === 'allowed') {
        statusElement.textContent = 'Allowed';
        statusElement.className = 'status-badge allowed';
      } else if (response.status === 'blocked') {
        statusElement.textContent = 'Blocked';
        statusElement.className = 'status-badge blocked';
      } else {
        statusElement.textContent = 'Checking...';
        statusElement.className = 'status-badge checking';
      }
    } catch (error) {
      console.error('Error checking site status:', error);
      statusElement.textContent = 'Error';
      statusElement.className = 'status-badge checking';
    }
  }

  async loadStatistics() {
    try {
      const result = await chrome.storage.local.get('visitLog');
      const visits = result.visitLog || [];
      
      // Filter today's visits
      const today = new Date().toDateString();
      const todayVisits = visits.filter(visit => 
        new Date(visit.timestamp).toDateString() === today
      );

      // Count unique sites
      const uniqueSites = new Set(todayVisits.map(visit => visit.domain));
      document.getElementById('sitesVisited').textContent = uniqueSites.size;

      // Count blocked sites (this would come from your backend in real implementation)
      document.getElementById('sitesBlocked').textContent = '0';

      // Calculate active time (simplified)
      document.getElementById('timeActive').textContent = todayVisits.length + 'm';
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  async loadRecentActivity() {
    try {
      const result = await chrome.storage.local.get('visitLog');
      const visits = result.visitLog || [];
      const activityContainer = document.getElementById('recentActivity');
      
      if (visits.length === 0) {
        activityContainer.innerHTML = '<div class="activity-item loading">No recent activity</div>';
        return;
      }

      // Get last 5 visits
      const recentVisits = visits.slice(-5).reverse();
      
      activityContainer.innerHTML = recentVisits.map(visit => {
        const time = new Date(visit.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return `
          <div class="activity-item">
            <div class="activity-site" title="${visit.domain}">${visit.domain}</div>
            <div class="activity-time">${time}</div>
            <div class="activity-status allowed">Allowed</div>
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  bindEvents() {
    // Profile selection
    document.getElementById('profileSelect').addEventListener('change', async (e) => {
      try {
        await chrome.runtime.sendMessage({
          action: 'switchProfile',
          profileId: e.target.value
        });
        await this.loadCurrentProfile();
        await this.updateSiteStatus();
      } catch (error) {
        console.error('Error switching profile:', error);
      }
    });

    // Allow current site
    document.getElementById('allowCurrentSite').addEventListener('click', async () => {
      await this.allowCurrentSite();
    });

    // Block current site
    document.getElementById('blockCurrentSite').addEventListener('click', async () => {
      await this.blockCurrentSite();
    });

    // Manage profiles
    document.getElementById('manageProfiles').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });

    // View activity
    document.getElementById('viewActivity').addEventListener('click', () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('activity.html')
      });
    });

    // Open settings
    document.getElementById('openSettings').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  async allowCurrentSite() {
    if (!this.currentTab || !this.currentProfile) return;

    try {
      const url = new URL(this.currentTab.url);
      const domain = url.hostname;

      // Get current profiles
      const result = await chrome.storage.local.get('profiles');
      const profiles = result.profiles || [];
      
      // Find and update current profile
      const profileIndex = profiles.findIndex(p => p.id === this.currentProfile.id);
      if (profileIndex !== -1) {
        if (!profiles[profileIndex].allowedSites.includes(domain)) {
          profiles[profileIndex].allowedSites.push(domain);
        }
        
        // Remove from blocked sites if present
        profiles[profileIndex].blockedSites = profiles[profileIndex].blockedSites.filter(
          site => site !== domain
        );

        await chrome.storage.local.set({ profiles });
        await this.updateSiteStatus();
        
        // Show feedback
        this.showNotification(`${domain} has been added to allowed sites`, 'success');
      }
    } catch (error) {
      console.error('Error allowing site:', error);
      this.showNotification('Error allowing site', 'error');
    }
  }

  async blockCurrentSite() {
    if (!this.currentTab || !this.currentProfile) return;

    try {
      const url = new URL(this.currentTab.url);
      const domain = url.hostname;

      // Get current profiles
      const result = await chrome.storage.local.get('profiles');
      const profiles = result.profiles || [];
      
      // Find and update current profile
      const profileIndex = profiles.findIndex(p => p.id === this.currentProfile.id);
      if (profileIndex !== -1) {
        if (!profiles[profileIndex].blockedSites.includes(domain)) {
          profiles[profileIndex].blockedSites.push(domain);
        }
        
        // Remove from allowed sites if present
        profiles[profileIndex].allowedSites = profiles[profileIndex].allowedSites.filter(
          site => site !== domain
        );

        await chrome.storage.local.set({ profiles });
        await this.updateSiteStatus();
        
        // Show feedback
        this.showNotification(`${domain} has been added to blocked sites`, 'success');
      }
    } catch (error) {
      console.error('Error blocking site:', error);
      this.showNotification('Error blocking site', 'error');
    }
  }

  showNotification(message, type) {
    // Simple notification - in a real extension you might want a toast system
    const statusElement = document.getElementById('siteStatus');
    const originalText = statusElement.textContent;
    const originalClass = statusElement.className;
    
    statusElement.textContent = type === 'success' ? '✓ Done' : '✗ Error';
    statusElement.className = `status-badge ${type === 'success' ? 'allowed' : 'blocked'}`;
    
    setTimeout(() => {
      statusElement.textContent = originalText;
      statusElement.className = originalClass;
    }, 2000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
