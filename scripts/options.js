// Options page script for Family Privacy Extension
class OptionsManager {
  constructor() {
    this.currentProfileId = null;
    this.profiles = [];
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadData();
    this.initializeTabs();
    this.initializeProfiles();
    this.initializeCategories();
    this.initializeSites();
    this.initializeTimeRestrictions();
    this.initializeSettings();
    this.initializeActivity();
    this.bindEvents();
  }

  async loadData() {
    try {
      const result = await chrome.storage.local.get(['profiles', 'currentProfile', 'settings']);
      this.profiles = result.profiles || [];
      this.currentProfileId = result.currentProfile;
      this.settings = result.settings || {};
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  initializeTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
      });
    });
  }

  initializeProfiles() {
    this.renderProfiles();
    this.populateProfileSelectors();
  }

  renderProfiles() {
    const profilesList = document.getElementById('profilesList');
    
    if (this.profiles.length === 0) {
      profilesList.innerHTML = '<p>No profiles found. Create your first profile to get started.</p>';
      return;
    }

    profilesList.innerHTML = this.profiles.map(profile => `
      <div class="profile-card ${profile.isDefault ? 'default' : ''}">
        <div class="profile-header">
          <div class="profile-info">
            <h3>${profile.name}</h3>
            <p>Profile ID: ${profile.id}</p>
            ${profile.description ? `<p>${profile.description}</p>` : ''}
          </div>
          ${profile.isDefault ? '<span class="profile-badge">Default</span>' : ''}
        </div>
        <div class="profile-stats">
          <p>Restrictions: ${Object.values(profile.restrictions || {}).filter(Boolean).length} active</p>
          <p>Allowed sites: ${(profile.allowedSites || []).length}</p>
          <p>Blocked sites: ${(profile.blockedSites || []).length}</p>
        </div>
        <div class="profile-actions">
          <button class="btn-primary edit-profile" data-profile-id="${profile.id}">Edit</button>
          <button class="btn-secondary set-active" data-profile-id="${profile.id}">Set Active</button>
          ${!profile.isDefault ? `<button class="btn-danger delete-profile" data-profile-id="${profile.id}">Delete</button>` : ''}
        </div>
      </div>
    `).join('');

    // Bind profile action events
    this.bindProfileActions();
  }

  populateProfileSelectors() {
    const selectors = ['categoryProfile', 'sitesProfile', 'timeProfile', 'activityProfile'];
    
    selectors.forEach(selectorId => {
      const select = document.getElementById(selectorId);
      if (select) {
        select.innerHTML = '<option value="">Select a profile...</option>' + 
          this.profiles.map(profile => 
            `<option value="${profile.id}" ${profile.id === this.currentProfileId ? 'selected' : ''}>${profile.name}</option>`
          ).join('');
      }
    });
  }

  initializeCategories() {
    const categories = [
      { id: 'adult', name: 'Adult Content', description: 'Explicit adult content and pornography' },
      { id: 'gambling', name: 'Gambling', description: 'Online gambling, casinos, and betting sites' },
      { id: 'violence', name: 'Violence', description: 'Violent content and graphic imagery' },
      { id: 'drugs', name: 'Drugs & Alcohol', description: 'Drug-related content and alcohol promotion' },
      { id: 'weapons', name: 'Weapons', description: 'Weapons, firearms, and military content' },
      { id: 'social', name: 'Social Media', description: 'Social networking platforms' },
      { id: 'entertainment', name: 'Entertainment', description: 'Movies, TV shows, and streaming services' },
      { id: 'gaming', name: 'Gaming', description: 'Video games and gaming platforms' },
      { id: 'news', name: 'News', description: 'News websites and current events' },
      { id: 'shopping', name: 'Shopping', description: 'E-commerce and online shopping' },
      { id: 'education', name: 'Education', description: 'Educational content and learning platforms' },
      { id: 'spam', name: 'Spam/Malicious', description: 'Spam, malware, and suspicious sites' },
      { id: 'phishing', name: 'Phishing', description: 'Phishing attempts and scam sites' },
      { id: 'malware', name: 'Malware', description: 'Sites known to distribute malware' }
    ];

    const categoriesGrid = document.getElementById('categoriesGrid');
    categoriesGrid.innerHTML = categories.map(category => `
      <div class="category-item">
        <div class="category-header">
          <span class="category-title">${category.name}</span>
          <label class="category-toggle">
            <input type="checkbox" data-category="${category.id}">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <p class="category-description">${category.description}</p>
      </div>
    `).join('');

    // Bind category profile selector
    document.getElementById('categoryProfile').addEventListener('change', (e) => {
      this.loadCategoriesForProfile(e.target.value);
    });

    // Bind category toggles
    categoriesGrid.addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        this.updateCategoryRestriction(e.target.dataset.category, e.target.checked);
      }
    });
  }

  loadCategoriesForProfile(profileId) {
    if (!profileId) return;
    
    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) return;

    const checkboxes = document.querySelectorAll('#categoriesGrid input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const category = checkbox.dataset.category;
      checkbox.checked = profile.restrictions && profile.restrictions[category];
    });
  }

  async updateCategoryRestriction(category, blocked) {
    const profileId = document.getElementById('categoryProfile').value;
    if (!profileId) return;

    const profileIndex = this.profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return;

    if (!this.profiles[profileIndex].restrictions) {
      this.profiles[profileIndex].restrictions = {};
    }

    this.profiles[profileIndex].restrictions[category] = blocked;
    
    await chrome.storage.local.set({ profiles: this.profiles });
    this.renderProfiles();
  }

  initializeSites() {
    // Bind sites profile selector
    document.getElementById('sitesProfile').addEventListener('change', (e) => {
      this.loadSitesForProfile(e.target.value);
    });

    // Bind add site buttons
    document.getElementById('addAllowedSite').addEventListener('click', () => {
      this.addSite('allowed');
    });

    document.getElementById('addBlockedSite').addEventListener('click', () => {
      this.addSite('blocked');
    });

    // Allow Enter key to add sites
    document.getElementById('allowedSiteInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addSite('allowed');
    });

    document.getElementById('blockedSiteInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addSite('blocked');
    });
  }

  loadSitesForProfile(profileId) {
    if (!profileId) {
      document.getElementById('allowedSitesList').innerHTML = '';
      document.getElementById('blockedSitesList').innerHTML = '';
      return;
    }
    
    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) return;

    this.renderSitesList('allowedSitesList', profile.allowedSites || []);
    this.renderSitesList('blockedSitesList', profile.blockedSites || []);
  }

  renderSitesList(listId, sites) {
    const list = document.getElementById(listId);
    
    if (sites.length === 0) {
      list.innerHTML = '<li class="site-item">No sites configured</li>';
      return;
    }

    list.innerHTML = sites.map(site => `
      <li class="site-item">
        <span class="site-domain">${site}</span>
        <button class="remove-site" data-site="${site}" data-list="${listId}">Remove</button>
      </li>
    `).join('');

    // Bind remove buttons
    list.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-site')) {
        this.removeSite(e.target.dataset.site, e.target.dataset.list);
      }
    });
  }

  async addSite(type) {
    const profileId = document.getElementById('sitesProfile').value;
    const inputId = type === 'allowed' ? 'allowedSiteInput' : 'blockedSiteInput';
    const input = document.getElementById(inputId);
    const domain = input.value.trim().toLowerCase();

    if (!profileId || !domain) return;

    // Basic domain validation
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      alert('Please enter a valid domain (e.g., example.com)');
      return;
    }

    const profileIndex = this.profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return;

    const sitesKey = type === 'allowed' ? 'allowedSites' : 'blockedSites';
    const oppositeSitesKey = type === 'allowed' ? 'blockedSites' : 'allowedSites';

    if (!this.profiles[profileIndex][sitesKey]) {
      this.profiles[profileIndex][sitesKey] = [];
    }

    // Check if site already exists
    if (this.profiles[profileIndex][sitesKey].includes(domain)) {
      alert('This site is already in the list');
      return;
    }

    // Add to the appropriate list
    this.profiles[profileIndex][sitesKey].push(domain);

    // Remove from opposite list if it exists
    if (this.profiles[profileIndex][oppositeSitesKey]) {
      this.profiles[profileIndex][oppositeSitesKey] = 
        this.profiles[profileIndex][oppositeSitesKey].filter(site => site !== domain);
    }

    await chrome.storage.local.set({ profiles: this.profiles });
    input.value = '';
    this.loadSitesForProfile(profileId);
    this.renderProfiles();
  }

  async removeSite(domain, listId) {
    const profileId = document.getElementById('sitesProfile').value;
    if (!profileId) return;

    const profileIndex = this.profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return;

    const sitesKey = listId === 'allowedSitesList' ? 'allowedSites' : 'blockedSites';
    
    if (this.profiles[profileIndex][sitesKey]) {
      this.profiles[profileIndex][sitesKey] = 
        this.profiles[profileIndex][sitesKey].filter(site => site !== domain);
    }

    await chrome.storage.local.set({ profiles: this.profiles });
    this.loadSitesForProfile(profileId);
    this.renderProfiles();
  }

  initializeTimeRestrictions() {
    // Implementation for time restrictions
    document.getElementById('timeProfile').addEventListener('change', (e) => {
      this.loadTimeRestrictionsForProfile(e.target.value);
    });
  }

  loadTimeRestrictionsForProfile(profileId) {
    const container = document.getElementById('timeRestrictionsContainer');
    
    if (!profileId) {
      container.innerHTML = '<p>Select a profile to configure time restrictions.</p>';
      return;
    }

    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) return;

    const timeRestrictions = profile.timeRestrictions || {
      enabled: false,
      allowedHours: { start: '09:00', end: '21:00' },
      allowedDays: [1, 2, 3, 4, 5, 6, 7]
    };

    container.innerHTML = `
      <div class="time-restriction-item">
        <label>
          <input type="checkbox" id="timeRestrictionsEnabled" ${timeRestrictions.enabled ? 'checked' : ''}>
          Enable time restrictions
        </label>
        
        <div class="time-controls">
          <div class="time-control">
            <label for="startTime">Start Time:</label>
            <input type="time" id="startTime" value="${timeRestrictions.allowedHours.start}">
          </div>
          <div class="time-control">
            <label for="endTime">End Time:</label>
            <input type="time" id="endTime" value="${timeRestrictions.allowedHours.end}">
          </div>
        </div>
        
        <div class="days-selector">
          <label>Allowed Days:</label>
          <div class="days-grid">
            ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => `
              <div class="day-checkbox">
                <input type="checkbox" id="day${index + 1}" value="${index + 1}" 
                       ${timeRestrictions.allowedDays.includes(index + 1) ? 'checked' : ''}>
                <label for="day${index + 1}">${day}</label>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Bind time restriction events
    container.addEventListener('change', () => {
      this.updateTimeRestrictions(profileId);
    });
  }

  async updateTimeRestrictions(profileId) {
    const profileIndex = this.profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) return;

    const enabled = document.getElementById('timeRestrictionsEnabled').checked;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const allowedDays = Array.from(document.querySelectorAll('.days-grid input:checked'))
      .map(checkbox => parseInt(checkbox.value));

    this.profiles[profileIndex].timeRestrictions = {
      enabled,
      allowedHours: { start: startTime, end: endTime },
      allowedDays
    };

    await chrome.storage.local.set({ profiles: this.profiles });
    this.renderProfiles();
  }

  initializeSettings() {
    // Load current settings
    document.getElementById('apiEndpoint').value = this.settings.apiEndpoint || '';
    document.getElementById('enableLogging').checked = this.settings.enableLogging !== false;
    document.getElementById('strictMode').checked = this.settings.strictMode || false;
    document.getElementById('notifications').checked = this.settings.notifications !== false;

    // Bind save settings
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    // Bind other setting actions
    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    document.getElementById('exportData').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('importData').addEventListener('click', () => {
      this.importData();
    });
  }

  async saveSettings() {
    const settings = {
      apiEndpoint: document.getElementById('apiEndpoint').value,
      enableLogging: document.getElementById('enableLogging').checked,
      strictMode: document.getElementById('strictMode').checked,
      notifications: document.getElementById('notifications').checked
    };

    await chrome.storage.local.set({ settings });
    this.settings = settings;
    alert('Settings saved successfully!');
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await chrome.storage.local.remove(['profiles', 'currentProfile', 'settings', 'visitLog']);
      location.reload();
    }
  }

  exportData() {
    const data = {
      profiles: this.profiles,
      settings: this.settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-privacy-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (data.profiles) {
          await chrome.storage.local.set({
            profiles: data.profiles,
            settings: data.settings || {}
          });
          
          if (data.profiles.length > 0) {
            await chrome.storage.local.set({
              currentProfile: data.profiles.find(p => p.isDefault)?.id || data.profiles[0].id
            });
          }

          alert('Data imported successfully!');
          location.reload();
        } else {
          alert('Invalid backup file format');
        }
      } catch (error) {
        alert('Error importing data: ' + error.message);
      }
    };
    input.click();
  }

  initializeActivity() {
    this.loadActivity();
  }

  async loadActivity() {
    try {
      const result = await chrome.storage.local.get('visitLog');
      const visits = result.visitLog || [];
      
      const table = document.getElementById('activityTable');
      
      if (visits.length === 0) {
        table.innerHTML = '<p>No browsing activity recorded yet.</p>';
        return;
      }

      const recentVisits = visits.slice(-50).reverse(); // Show last 50 visits
      
      table.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Domain</th>
              <th>Profile</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${recentVisits.map(visit => {
              const date = new Date(visit.timestamp);
              const profile = this.profiles.find(p => p.id === visit.profileId);
              return `
                <tr>
                  <td>${date.toLocaleString()}</td>
                  <td>${visit.domain}</td>
                  <td>${profile ? profile.name : 'Unknown'}</td>
                  <td><span class="activity-status allowed">Allowed</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } catch (error) {
      console.error('Error loading activity:', error);
    }
  }

  bindEvents() {
    // Profile modal events
    document.getElementById('addProfile').addEventListener('click', () => {
      this.openProfileModal();
    });

    document.querySelector('.close').addEventListener('click', () => {
      this.closeProfileModal();
    });

    document.getElementById('cancelProfile').addEventListener('click', () => {
      this.closeProfileModal();
    });

    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfile();
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
      const modal = document.getElementById('profileModal');
      if (e.target === modal) {
        this.closeProfileModal();
      }
    });
  }

  bindProfileActions() {
    // Edit profile buttons
    document.querySelectorAll('.edit-profile').forEach(button => {
      button.addEventListener('click', (e) => {
        this.openProfileModal(e.target.dataset.profileId);
      });
    });

    // Set active profile buttons
    document.querySelectorAll('.set-active').forEach(button => {
      button.addEventListener('click', async (e) => {
        await this.setActiveProfile(e.target.dataset.profileId);
      });
    });

    // Delete profile buttons
    document.querySelectorAll('.delete-profile').forEach(button => {
      button.addEventListener('click', (e) => {
        this.deleteProfile(e.target.dataset.profileId);
      });
    });
  }

  openProfileModal(profileId = null) {
    const modal = document.getElementById('profileModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('profileForm');
    
    if (profileId) {
      const profile = this.profiles.find(p => p.id === profileId);
      if (profile) {
        title.textContent = 'Edit Profile';
        document.getElementById('profileName').value = profile.name;
        document.getElementById('profileDescription').value = profile.description || '';
        document.getElementById('isDefaultProfile').checked = profile.isDefault || false;
        form.dataset.profileId = profileId;
      }
    } else {
      title.textContent = 'Add Profile';
      form.reset();
      delete form.dataset.profileId;
    }
    
    modal.style.display = 'block';
  }

  closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
  }

  async saveProfile() {
    const form = document.getElementById('profileForm');
    const name = document.getElementById('profileName').value.trim();
    const description = document.getElementById('profileDescription').value.trim();
    const isDefault = document.getElementById('isDefaultProfile').checked;

    if (!name) {
      alert('Please enter a profile name');
      return;
    }

    const profileId = form.dataset.profileId;

    if (profileId) {
      // Edit existing profile
      const profileIndex = this.profiles.findIndex(p => p.id === profileId);
      if (profileIndex !== -1) {
        this.profiles[profileIndex].name = name;
        this.profiles[profileIndex].description = description;
        
        if (isDefault) {
          // Remove default from other profiles
          this.profiles.forEach(p => p.isDefault = false);
          this.profiles[profileIndex].isDefault = true;
        }
      }
    } else {
      // Create new profile
      const newProfile = {
        id: this.generateUniqueId(),
        name,
        description,
        isDefault: isDefault || this.profiles.length === 0,
        restrictions: {
          adult: true,
          gambling: true,
          violence: true,
          drugs: true,
          weapons: true,
          social: false,
          entertainment: false,
          gaming: false,
          news: false,
          shopping: false,
          education: false,
          spam: true,
          phishing: true,
          malware: true
        },
        allowedSites: [],
        blockedSites: [],
        timeRestrictions: {
          enabled: false,
          allowedHours: { start: '09:00', end: '21:00' },
          allowedDays: [1, 2, 3, 4, 5, 6, 7]
        }
      };

      if (newProfile.isDefault) {
        // Remove default from other profiles
        this.profiles.forEach(p => p.isDefault = false);
      }

      this.profiles.push(newProfile);
    }

    await chrome.storage.local.set({ profiles: this.profiles });
    this.closeProfileModal();
    this.renderProfiles();
    this.populateProfileSelectors();
  }

  async setActiveProfile(profileId) {
    await chrome.storage.local.set({ currentProfile: profileId });
    this.currentProfileId = profileId;
    this.populateProfileSelectors();
    alert('Profile activated successfully!');
  }

  async deleteProfile(profileId) {
    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) return;

    if (confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
      this.profiles = this.profiles.filter(p => p.id !== profileId);
      
      // If deleted profile was current, set a new current profile
      if (this.currentProfileId === profileId && this.profiles.length > 0) {
        this.currentProfileId = this.profiles[0].id;
        await chrome.storage.local.set({ currentProfile: this.currentProfileId });
      }

      await chrome.storage.local.set({ profiles: this.profiles });
      this.renderProfiles();
      this.populateProfileSelectors();
    }
  }

  generateUniqueId() {
    return 'profile_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
