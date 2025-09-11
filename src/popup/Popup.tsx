import React, { useState, useEffect } from 'react';
import { Shield, Settings, Activity, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Profile, SiteStatus, Statistics } from '@/types';
import { useAuth } from '../lib/auth-service';
import { EXTERNAL_URLS } from '../lib/config';

interface PopupProps {}

const Popup: React.FC<PopupProps> = () => {
  const { isAuthenticated, user, loading, signIn, signOut } = useAuth();
  const [currentDomain, setCurrentDomain] = useState<string>('Loading...');
  const [siteStatus, setSiteStatus] = useState<SiteStatus>({ status: 'checking' });
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string>('');
  const [statistics, setStatistics] = useState<Statistics>({
    sitesVisited: 0,
    sitesBlocked: 0,
    timeActive: 0
  });
  const [authError, setAuthError] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    initializePopup();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('User Data:', {
        id: user.id,
        email: user.email,
        name: user.name
      });
    }
  }, [user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoggingIn) return; // Prevent multiple submissions
    
    try {
      setAuthError('');
      setIsLoggingIn(true);
      await signIn(email, password);
      setEmail('');
      setPassword('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(errorMessage);
      console.error('Sign-in error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

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
        {isAuthenticated && user && (
          <div className="flex items-center gap-2">
            <img 
              src={user.avatar} 
              alt="Profile" 
              className="w-6 h-6 rounded-full"
            />
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => signOut()}
              className="text-xs"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {/* Authentication Section */}
      {!isAuthenticated ? (
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access family privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={isLoggingIn || loading}
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  minLength={6}
                  disabled={isLoggingIn || loading}
                />
              </div>
              <Button 
                type="submit"
                className="w-full"
                size="sm"
                disabled={isLoggingIn || loading || !email || !password}
              >
                <User className="h-4 w-4 mr-2" />
                {isLoggingIn ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
            {authError && (
              <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-800">{authError}</p>
              </div>
            )}
            {loading && !authError && (
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">Checking authentication...</p>
              </div>
            )}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Don't have an account?</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => window.open(EXTERNAL_URLS.SIGNUP, '_blank')}
              >
                Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* User Profile Section */}
          {user && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  User Profile
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={signOut}
                    className="text-xs"
                  >
                    Sign Out
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <img 
                    src={user.avatar} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.name || user.username || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    {user.username && user.username !== user.email.split('@')[0] && (
                      <p className="text-xs text-muted-foreground">
                        @{user.username}
                      </p>
                    )}
                  </div>
                </div>
                {currentProfileData && (
                  <p className="text-xs text-muted-foreground">
                    Active Profile: {currentProfileData.name}
                  </p>
                )}
                <div className="text-xs text-muted-foreground">
                  Status: {user.isActive ? 'Active' : 'Inactive'}
                </div>
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
        </>
      )}
    </div>
  );
};

export default Popup;
