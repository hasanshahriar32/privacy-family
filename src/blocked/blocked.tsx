import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Shield, Home, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import '../globals.css';

const BlockedPage: React.FC = () => {
  const [domain, setDomain] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  useEffect(() => {
    // Get domain and reason from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    setDomain(urlParams.get('domain') || 'Unknown site');
    setReason(urlParams.get('reason') || 'Content filtering rule');
  }, []);

  const goBack = () => {
    window.history.back();
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const requestAccess = async () => {
    try {
      await chrome.runtime.sendMessage({
        action: 'requestAccess',
        domain: domain
      });
      // Show success message or redirect
      alert('Access request sent. Please check with your administrator.');
    } catch (error) {
      console.error('Error requesting access:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Site Blocked</CardTitle>
            <CardDescription>
              This website has been blocked by Family Privacy Extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium">Domain:</span>
                  <p className="text-sm text-muted-foreground">{domain}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Reason:</span>
                  <p className="text-sm text-muted-foreground">{reason}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Protected by Family Privacy Extension</span>
            </div>

            <div className="space-y-2">
              <Button onClick={goBack} className="w-full" variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              
              <Button onClick={requestAccess} className="w-full" variant="secondary">
                Request Access
              </Button>
              
              <Button onClick={openSettings} className="w-full" variant="ghost">
                <Settings className="mr-2 h-4 w-4" />
                Open Settings
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Family Privacy Extension v2.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const container = document.getElementById('app')!;
const root = createRoot(container);

root.render(<BlockedPage />);
