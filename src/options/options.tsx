import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client'
import { Settings, Users, Globe, Clock, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Profile } from '@/types';
import '../globals.css'
import { ExtensionClerkProvider } from '../lib/clerk-provider'
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  SignUpButton, 
  UserButton, 
  useUser 
} from '@clerk/clerk-react';

const Options: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('profiles');
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (user) {
      console.log('Options Page - Clerk User Data:', {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        imageUrl: user.imageUrl
      });
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      const result = await chrome.storage.local.get(['profiles']);
      setProfiles(result.profiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const tabs = [
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'categories', label: 'Categories', icon: Globe },
    { id: 'sites', label: 'Sites', icon: Shield },
    { id: 'time', label: 'Time Rules', icon: Clock },
    { id: 'activity', label: 'Activity', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profiles':
        return <ProfilesTab profiles={profiles} onProfilesChange={setProfiles} />;
      case 'categories':
        return <CategoriesTab profiles={profiles} />;
      case 'sites':
        return <SitesTab profiles={profiles} />;
      case 'time':
        return <TimeTab profiles={profiles} />;
      case 'activity':
        return <ActivityTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Family Privacy Extension</h1>
              <p className="text-sm text-muted-foreground">
                Configure profiles and content filtering settings
              </p>
            </div>
            <SignedIn>
              <div className="flex items-center gap-4">
                {user && (
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {user.fullName || user.firstName || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
      </header>

      <SignedOut>
        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to access the family privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <SignInButton mode="modal">
                  <Button variant="default" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="outline" className="w-full">
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="container mx-auto px-6 py-6">
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <nav className="w-64 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </nav>

            {/* Main Content */}
            <main className="flex-1">
              {renderTabContent()}
            </main>
          </div>
        </div>
      </SignedIn>
    </div>
  );
};

// Placeholder components for each tab
const ProfilesTab: React.FC<{ profiles: Profile[]; onProfilesChange: (profiles: Profile[]) => void }> = ({ profiles }) => {
  const { user } = useUser();
  
  return (
    <div className="space-y-6">
      {/* User Info Card */}
      {user && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Your Clerk authentication details and account settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user.imageUrl && (
                <img 
                  src={user.imageUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  {user.fullName || `${user.firstName} ${user.lastName}`.trim() || 'User'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.primaryEmailAddress?.emailAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  User ID: {user.id}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member since: {user.createdAt?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profiles Management */}
      <Card>
        <CardHeader>
          <CardTitle>Family Profiles</CardTitle>
          <CardDescription>
            Create different profiles for family members with customized restrictions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profiles.length === 0 ? (
              <p className="text-muted-foreground">No profiles found. Create your first profile.</p>
            ) : (
              profiles.map((profile) => (
                <div key={profile.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profile.isDefault ? 'Default Profile' : 'Custom Profile'}
                  </p>
                </div>
              ))
            )}
            <Button>Add New Profile</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CategoriesTab: React.FC<{ profiles: Profile[] }> = () => (
  <Card>
    <CardHeader>
      <CardTitle>Content Categories</CardTitle>
      <CardDescription>
        Configure which types of content should be blocked for each profile.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Category configuration coming soon...</p>
    </CardContent>
  </Card>
);

const SitesTab: React.FC<{ profiles: Profile[] }> = () => (
  <Card>
    <CardHeader>
      <CardTitle>Site-Specific Rules</CardTitle>
      <CardDescription>
        Manually allow or block specific websites.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Site rules configuration coming soon...</p>
    </CardContent>
  </Card>
);

const TimeTab: React.FC<{ profiles: Profile[] }> = () => (
  <Card>
    <CardHeader>
      <CardTitle>Time Restrictions</CardTitle>
      <CardDescription>
        Set allowed browsing hours and days for each profile.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Time restrictions coming soon...</p>
    </CardContent>
  </Card>
);

const ActivityTab: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Browsing Activity</CardTitle>
      <CardDescription>
        View detailed browsing history and statistics.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Activity dashboard coming soon...</p>
    </CardContent>
  </Card>
);

const SettingsTab: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Extension Settings</CardTitle>
      <CardDescription>
        Configure general extension settings and preferences.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Settings panel coming soon...</p>
    </CardContent>
  </Card>
);

const container = document.getElementById('app')!
const root = createRoot(container)

root.render(
  <ExtensionClerkProvider>
    <Options />
  </ExtensionClerkProvider>
)
