// Background script for Family Privacy Extension
import { Profile, ExtensionSettings, ActivityLog, SiteStatus, Statistics } from '@/types';

class FamilyPrivacyExtension {
  private apiEndpoint = 'https://your-backend-api.com/api'; // Replace with your backend URL

  constructor() {
    this.init();
  }

  init() {
    // Initialize default settings
    this.initializeDefaultSettings();
    
    // Listen for tab updates
    chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
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

    // Listen for messages from content script and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep the message channel open for async response
    });
  }

  async initializeDefaultSettings() {
    const result = await chrome.storage.local.get(['profiles', 'currentProfile', 'settings']);
    
    if (!result.profiles) {
      const defaultProfile: Profile = {
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

      const settings: ExtensionSettings = {
        apiEndpoint: this.apiEndpoint,
        enableLogging: true,
        strictMode: false
      };

      await chrome.storage.local.set({
        profiles: [defaultProfile],
        currentProfile: defaultProfile.id,
        settings
      });
    }
  }

  async handleTabUpdate(tab: chrome.tabs.Tab) {
    try {
      if (!tab.url) return;
      
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
      
      if (shouldBlock.block && tab.id) {
        await this.blockSite(tab.id, shouldBlock.reason, domain);
      }
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }

  async handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) {
    try {
      switch (request.action) {
        case 'getCurrentProfile':
          const profile = await this.getCurrentProfile();
          sendResponse(profile);
          break;

        case 'checkSiteStatus':
          const status = await this.checkSiteStatus(request.domain);
          sendResponse(status);
          break;

        case 'allowSite':
          await this.allowSite(request.domain);
          sendResponse({ success: true });
          break;

        case 'blockSite':
          await this.blockSite(sender.tab?.id, 'User blocked', request.domain);
          sendResponse({ success: true });
          break;

        case 'getStatistics':
          const stats = await this.getStatistics();
          sendResponse(stats);
          break;

        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  async getCurrentProfile(): Promise<Profile | null> {
    try {
      const result = await chrome.storage.local.get(['profiles', 'currentProfile']);
      if (result.profiles && result.currentProfile) {
        return result.profiles.find((p: Profile) => p.id === result.currentProfile) || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting current profile:', error);
      return null;
    }
  }

  async checkSiteStatus(domain: string): Promise<SiteStatus> {
    try {
      const currentProfile = await this.getCurrentProfile();
      if (!currentProfile) {
        return { status: 'checking' };
      }

      // Check if explicitly allowed
      if (currentProfile.allowedSites.includes(domain)) {
        return { status: 'allowed', reason: 'Explicitly allowed' };
      }

      // Check if explicitly blocked
      if (currentProfile.blockedSites.includes(domain)) {
        return { status: 'blocked', reason: 'Explicitly blocked' };
      }

      // Check category restrictions (simplified for demo)
      const shouldBlock = await this.shouldBlockSite(domain, `https://${domain}`, currentProfile);
      
      return {
        status: shouldBlock.block ? 'blocked' : 'allowed',
        reason: shouldBlock.reason
      };
    } catch (error) {
      console.error('Error checking site status:', error);
      return { status: 'checking' };
    }
  }

  async shouldBlockSite(domain: string, _url: string, profile: Profile): Promise<{ block: boolean; reason: string }> {
    // Check explicit allow/block lists first
    if (profile.allowedSites.includes(domain)) {
      return { block: false, reason: 'Explicitly allowed' };
    }

    if (profile.blockedSites.includes(domain)) {
      return { block: true, reason: 'Explicitly blocked' };
    }

    // Check time restrictions
    if (profile.timeRestrictions.enabled) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const currentDay = now.getDay();
      
      const [startHour, startMin] = profile.timeRestrictions.allowedHours.start.split(':').map(Number);
      const [endHour, endMin] = profile.timeRestrictions.allowedHours.end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      if (!profile.timeRestrictions.allowedDays.includes(currentDay) ||
          currentTime < startTime || currentTime > endTime) {
        return { block: true, reason: 'Outside allowed time' };
      }
    }

    // Simple category checking (in a real implementation, you'd use a more sophisticated API)
    const suspiciousDomains = [
      'example-adult.com',
      'gambling-site.com',
      'violent-content.com'
    ];

    if (suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
      return { block: true, reason: 'Category restriction' };
    }

    return { block: false, reason: 'Allowed by default' };
  }

  async blockSite(tabId: number | undefined, reason: string, domain: string) {
    if (!tabId) return;

    try {
      const blockedPageUrl = chrome.runtime.getURL('src/blocked/index.html') + `?domain=${encodeURIComponent(domain)}&reason=${encodeURIComponent(reason)}`;
      await chrome.tabs.update(tabId, { url: blockedPageUrl });
    } catch (error) {
      console.error('Error blocking site:', error);
    }
  }

  async allowSite(domain: string) {
    try {
      const result = await chrome.storage.local.get(['profiles', 'currentProfile']);
      if (result.profiles && result.currentProfile) {
        const profiles = result.profiles.map((profile: Profile) => {
          if (profile.id === result.currentProfile) {
            return {
              ...profile,
              allowedSites: [...profile.allowedSites.filter(site => site !== domain), domain],
              blockedSites: profile.blockedSites.filter(site => site !== domain)
            };
          }
          return profile;
        });

        await chrome.storage.local.set({ profiles });
      }
    } catch (error) {
      console.error('Error allowing site:', error);
    }
  }

  async logVisit(domain: string, url: string, profileId: string) {
    try {
      const log: ActivityLog = {
        id: this.generateUniqueId(),
        domain,
        url,
        timestamp: Date.now(),
        profileId,
        action: 'visited'
      };

      const result = await chrome.storage.local.get(['activityLogs']);
      const logs = result.activityLogs || [];
      logs.push(log);

      // Keep only last 1000 entries
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      await chrome.storage.local.set({ activityLogs: logs });
    } catch (error) {
      console.error('Error logging visit:', error);
    }
  }

  async getStatistics(): Promise<Statistics> {
    try {
      const result = await chrome.storage.local.get(['activityLogs']);
      const logs: ActivityLog[] = result.activityLogs || [];

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

      const todayLogs = logs.filter(log => log.timestamp >= startOfDay);
      
      const sitesVisited = new Set(todayLogs.filter(log => log.action === 'visited').map(log => log.domain)).size;
      const sitesBlocked = todayLogs.filter(log => log.action === 'blocked').length;
      
      // Simple time calculation (in minutes)
      const timeActive = Math.floor(todayLogs.length * 2); // Rough estimate

      return {
        sitesVisited,
        sitesBlocked,
        timeActive
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return { sitesVisited: 0, sitesBlocked: 0, timeActive: 0 };
    }
  }

  generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Initialize the extension
new FamilyPrivacyExtension();
