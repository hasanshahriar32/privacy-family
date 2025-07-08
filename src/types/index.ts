export interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
  restrictions: {
    adult: boolean;
    gambling: boolean;
    violence: boolean;
    drugs: boolean;
    weapons: boolean;
    social: boolean;
    entertainment: boolean;
    gaming: boolean;
    news: boolean;
    shopping: boolean;
    education: boolean;
    spam: boolean;
    phishing: boolean;
    malware: boolean;
  };
  allowedSites: string[];
  blockedSites: string[];
  timeRestrictions: {
    enabled: boolean;
    allowedHours: { start: string; end: string };
    allowedDays: number[];
  };
}

export interface ExtensionSettings {
  apiEndpoint: string;
  enableLogging: boolean;
  strictMode: boolean;
}

export interface ActivityLog {
  id: string;
  domain: string;
  url: string;
  timestamp: number;
  profileId: string;
  action: 'visited' | 'blocked' | 'allowed';
}

export interface SiteStatus {
  status: 'allowed' | 'blocked' | 'checking';
  reason?: string;
}

export interface Statistics {
  sitesVisited: number;
  sitesBlocked: number;
  timeActive: number;
}
