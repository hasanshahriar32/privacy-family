// Background script for Family Privacy Extension
class FamilyPrivacyExtension {
  constructor() {
    this.apiEndpoint = 'https://your-backend-api.com/api'; // Replace with your backend URL
    this.init();
  }

  init() {
    // Initialize default settings
    this.initializeDefaultSettings();
    
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tab);
      }
    });

    // Listen for tab activation
    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
          this.handleTabUpdate(tab);
        }
      });
    });

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });
  }

  async initializeDefaultSettings() {
    const result = await chrome.storage.local.get(['profiles', 'currentProfile', 'settings']);
    
    if (!result.profiles) {
      const defaultProfile = {
        id: this.generateUniqueId(),
        name: 'Default Profile',
        isDefault: true,
        restrictions: {
          adult: true,      // Block adult content
          gambling: true,   // Block gambling sites
          violence: true,   // Block violent content
          drugs: true,      // Block drug-related content
          weapons: true,    // Block weapons/firearms content
          social: false,    // Allow social media
          entertainment: false, // Allow entertainment
          gaming: false,    // Allow gaming
          news: false,      // Allow news sites
          shopping: false,  // Allow shopping
          education: false, // Allow educational content
          spam: true,       // Block spam/malicious sites
          phishing: true,   // Block phishing attempts
          malware: true     // Block malware sites
        },
        allowedSites: [],
        blockedSites: [],
        timeRestrictions: {
          enabled: false,
          allowedHours: { start: '09:00', end: '21:00' },
          allowedDays: [1, 2, 3, 4, 5, 6, 7] // 1=Monday, 7=Sunday
        }
      };

      await chrome.storage.local.set({
        profiles: [defaultProfile],
        currentProfile: defaultProfile.id,
        settings: {
          apiEndpoint: this.apiEndpoint,
          enableLogging: true,
          strictMode: false
        }
      });
    }
  }

  async handleTabUpdate(tab) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      // Skip chrome:// and extension pages
      if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
        return;
      }

      const currentProfile = await this.getCurrentProfile();
      if (!currentProfile) return;

      // Log the visit
      await this.logVisit(domain, url.href, currentProfile.id);

      // Check if site should be blocked
      const shouldBlock = await this.shouldBlockSite(domain, url.href, currentProfile);
      
      if (shouldBlock.block) {
        await this.blockSite(tab.id, shouldBlock.reason, domain);
      }

    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }

  async getCurrentProfile() {
    const result = await chrome.storage.local.get(['profiles', 'currentProfile']);
    if (result.profiles && result.currentProfile) {
      return result.profiles.find(p => p.id === result.currentProfile);
    }
    return null;
  }

  async shouldBlockSite(domain, url, profile) {
    try {
      // Check if site is explicitly allowed
      if (profile.allowedSites.some(site => domain.includes(site))) {
        return { block: false, reason: 'explicitly_allowed' };
      }

      // Check if site is explicitly blocked
      if (profile.blockedSites.some(site => domain.includes(site))) {
        return { block: true, reason: 'explicitly_blocked' };
      }

      // Check time restrictions
      if (profile.timeRestrictions.enabled) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay() || 7; // Convert Sunday from 0 to 7
        
        const startHour = parseInt(profile.timeRestrictions.allowedHours.start.split(':')[0]);
        const endHour = parseInt(profile.timeRestrictions.allowedHours.end.split(':')[0]);
        
        if (!profile.timeRestrictions.allowedDays.includes(currentDay) ||
            currentHour < startHour || currentHour >= endHour) {
          return { block: true, reason: 'time_restriction' };
        }
      }

      // Send to backend for category analysis
      const categories = await this.analyzeWebsiteCategories(domain, url, profile.id);
      
      // Check if any blocked categories match
      for (const category of categories) {
        if (profile.restrictions[category]) {
          return { block: true, reason: `blocked_category_${category}` };
        }
      }

      return { block: false, reason: 'allowed' };
    } catch (error) {
      console.error('Error checking if site should be blocked:', error);
      return { block: false, reason: 'error' };
    }
  }

  async analyzeWebsiteCategories(domain, url, profileId) {
    try {
      const response = await fetch(`${this.apiEndpoint}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          url,
          profileId,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.categories || [];
      }
    } catch (error) {
      console.error('Error analyzing website categories:', error);
    }

    // Fallback: basic local categorization
    return this.basicCategorization(domain);
  }

  basicCategorization(domain) {
    const categories = [];
    
    // Basic keyword matching for demonstration
    const adultKeywords = ['porn', 'xxx', 'adult', 'sex', 'nude'];
    const socialKeywords = ['facebook', 'twitter', 'instagram', 'tiktok', 'snapchat'];
    const gamingKeywords = ['game', 'steam', 'xbox', 'playstation', 'twitch'];
    const entertainmentKeywords = ['youtube', 'netflix', 'hulu', 'disney'];
    
    if (adultKeywords.some(keyword => domain.includes(keyword))) {
      categories.push('adult');
    }
    if (socialKeywords.some(keyword => domain.includes(keyword))) {
      categories.push('social');
    }
    if (gamingKeywords.some(keyword => domain.includes(keyword))) {
      categories.push('gaming');
    }
    if (entertainmentKeywords.some(keyword => domain.includes(keyword))) {
      categories.push('entertainment');
    }

    return categories;
  }

  async logVisit(domain, url, profileId) {
    try {
      // Send to backend
      await fetch(`${this.apiEndpoint}/log-visit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          url,
          profileId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });

      // Also store locally for offline access
      const visits = await chrome.storage.local.get('visitLog') || { visitLog: [] };
      visits.visitLog = visits.visitLog || [];
      visits.visitLog.push({
        domain,
        url,
        profileId,
        timestamp: new Date().toISOString()
      });

      // Keep only last 1000 visits
      if (visits.visitLog.length > 1000) {
        visits.visitLog = visits.visitLog.slice(-1000);
      }

      await chrome.storage.local.set(visits);
    } catch (error) {
      console.error('Error logging visit:', error);
    }
  }

  async blockSite(tabId, reason, domain) {
    try {
      const blockedPageUrl = chrome.runtime.getURL('blocked.html') + 
        `?reason=${encodeURIComponent(reason)}&domain=${encodeURIComponent(domain)}`;
      
      await chrome.tabs.update(tabId, { url: blockedPageUrl });
    } catch (error) {
      console.error('Error blocking site:', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getCurrentProfile':
        this.getCurrentProfile().then(sendResponse);
        return true;
      
      case 'switchProfile':
        this.switchProfile(request.profileId).then(sendResponse);
        return true;
      
      case 'checkSiteStatus':
        this.checkSiteStatus(request.domain).then(sendResponse);
        return true;
      
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async switchProfile(profileId) {
    try {
      await chrome.storage.local.set({ currentProfile: profileId });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkSiteStatus(domain) {
    const currentProfile = await this.getCurrentProfile();
    if (!currentProfile) {
      return { status: 'error', message: 'No profile found' };
    }

    const result = await this.shouldBlockSite(domain, `https://${domain}`, currentProfile);
    return { 
      status: result.block ? 'blocked' : 'allowed', 
      reason: result.reason,
      profile: currentProfile.name
    };
  }

  generateUniqueId() {
    return 'profile_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }
}

// Initialize the extension
new FamilyPrivacyExtension();
