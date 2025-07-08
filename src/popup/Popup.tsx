import React, { useState, useEffect } from 'react';
import { Shield, Settings, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Profile, SiteStatus, Statistics } from '@/types';
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  SignUpButton, 
  UserButton, 
  useUser 
} from '@clerk/clerk-react';

interface PopupProps {}

const Popup: React.FC<PopupProps> = () => {
  const { user } = useUser();
  const [currentDomain, setCurrentDomain] = useState<string>('Loading...');
  const [siteStatus, setSiteStatus] = useState<SiteStatus>({ status: 'checking' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string>('');
  const [statistics, setStatistics] = useState<Statistics>({
    sitesVisited: 0,
    sitesBlocked: 0,
    timeActive: 0
  });

  useEffect(() => {
    initializePopup();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('Clerk User Data:', {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,
        publicMetadata: user.publicMetadata,
        unsafeMetadata: user.unsafeMetadata
      });
    }
  }, [user]);

  const initializePopup = async () => {
    await getCurrentTab();
    await loadProfiles();
    await loadStatistics();
  };

  const getCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab.url) {
        const url = new URL(tab.url);
        setCurrentDomain(url.hostname);
        await checkSiteStatus(url.hostname);
      }
    } catch (error) {
      console.error('Error getting current tab:', error);
      setCurrentDomain('Unknown');
    }
  };

  const loadProfiles = async () => {
    try {
      const result = await chrome.storage.local.get(['profiles', 'currentProfile']);
      setProfiles(result.profiles || []);
      setCurrentProfile(result.currentProfile || '');
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStatistics' });
      setStatistics(response || { sitesVisited: 0, sitesBlocked: 0, timeActive: 0 });
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const checkSiteStatus = async (domain: string) => {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'checkSiteStatus',
        domain
      });
      setSiteStatus(response);
    } catch (error) {
      console.error('Error checking site status:', error);
      setSiteStatus({ status: 'checking' });
    }
  };

  const allowCurrentSite = async () => {
    try {
      await chrome.runtime.sendMessage({
        action: 'allowSite',
        domain: currentDomain
      });
      setSiteStatus({ status: 'allowed' });
    } catch (error) {
      console.error('Error allowing site:', error);
    }
  };

  const blockCurrentSite = async () => {
    try {
      await chrome.runtime.sendMessage({
        action: 'blockSite',
        domain: currentDomain
      });
      setSiteStatus({ status: 'blocked' });
    } catch (error) {
      console.error('Error blocking site:', error);
    }
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  const getStatusIcon = () => {
    switch (siteStatus.status) {
      case 'allowed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (siteStatus.status) {
      case 'allowed':
        return 'Allowed';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Checking...';
    }
  };

  const currentProfileData = profiles.find(p => p.id === currentProfile);

  return (
    <div className="w-80 p-4 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-8 w-8 text-primary" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Family Privacy</h1>
          <p className="text-sm text-muted-foreground">Extension v2.0</p>
        </div>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>

      {/* Authentication Section */}
      <SignedOut>
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Welcome</CardTitle>
            <CardDescription>Sign in to access your family privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <SignInButton mode="modal">
                <Button size="sm" variant="default" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" variant="outline" className="w-full">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </CardContent>
        </Card>
      </SignedOut>

      <SignedIn>
        {/* User Profile Section */}
        {user && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">User Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                {user.imageUrl && (
                  <img 
                    src={user.imageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {user.fullName || user.firstName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
              </div>
              {currentProfileData && (
                <p className="text-xs text-muted-foreground">
                  Active Profile: {currentProfileData.name}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Current Site Status */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Current Site</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{currentDomain}</span>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                <span className="text-sm">{getStatusText()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={allowCurrentSite}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Allow
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={blockCurrentSite}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Block
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="secondary">
                <Activity className="h-3 w-3 mr-1" />
                Activity
              </Button>
              <Button size="sm" variant="secondary" onClick={openOptions}>
                <Settings className="h-3 w-3 mr-1" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today's Stats</CardTitle>
            <CardDescription>Your browsing activity summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-primary">
                  {statistics.sitesVisited}
                </div>
                <div className="text-xs text-muted-foreground">Sites Visited</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-destructive">
                  {statistics.sitesBlocked}
                </div>
                <div className="text-xs text-muted-foreground">Sites Blocked</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {Math.floor(statistics.timeActive / 60)}m
                </div>
                <div className="text-xs text-muted-foreground">Active Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SignedIn>
    </div>
  );
};

export default Popup;
