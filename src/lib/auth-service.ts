// Chrome Identity API Authentication Service
export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
  verified_email?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isEdge: boolean;
}

class ChromeAuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isEdge: this.isEdgeBrowser()
  };

  constructor() {
    this.initializeAuth();
  }

  private isEdgeBrowser(): boolean {
    // Detect if we're running on Microsoft Edge
    return navigator.userAgent.includes('Edg/') || 
           !chrome.identity || 
           typeof chrome.identity.getAuthToken !== 'function';
  }

  private async initializeAuth() {
    // Check if user is already authenticated
    const token = await this.getStoredToken();
    if (token && !this.currentState.isEdge) {
      try {
        const user = await this.getUserInfo(token);
        this.updateState({
          isAuthenticated: true,
          user,
          token,
          isEdge: this.currentState.isEdge
        });
      } catch (error) {
        console.error('Failed to validate stored token:', error);
        await this.clearStoredToken();
      }
    }
  }

  async signIn(): Promise<User> {
    return new Promise((resolve, reject) => {
      // Check if we're on Edge and Identity API is not available
      if (this.currentState.isEdge) {
        reject(new Error('Chrome Identity API not supported on Microsoft Edge. Please use Chrome browser for authentication.'));
        return;
      }

      if (!chrome.identity || typeof chrome.identity.getAuthToken !== 'function') {
        reject(new Error('Chrome Identity API not available'));
        return;
      }

      chrome.identity.getAuthToken({ interactive: true }, async (token) => {
        if (chrome.runtime.lastError) {
          const errorMessage = chrome.runtime.lastError.message;
          
          // Provide specific error messages for common OAuth issues
          if (errorMessage?.includes('OAuth2 request failed')) {
            reject(new Error('OAuth configuration error. Please check that your Google Client ID is correctly set up in the Google Cloud Console and that the extension ID is added to authorized origins.'));
          } else if (errorMessage?.includes('invalid_client')) {
            reject(new Error('Invalid Google Client ID. Please verify your Client ID in the manifest.json file.'));
          } else if (errorMessage?.includes('redirect_uri')) {
            reject(new Error('Redirect URI mismatch. Please add your extension ID to the authorized redirect URIs in Google Cloud Console.'));
          } else {
            reject(new Error(`Authentication failed: ${errorMessage}`));
          }
          return;
        }

        if (!token) {
          reject(new Error('No authentication token received. Please try again.'));
          return;
        }

        try {
          const user = await this.getUserInfo(token);
          await this.storeToken(token);
          
          this.updateState({
            isAuthenticated: true,
            user,
            token,
            isEdge: this.currentState.isEdge
          });

          resolve(user);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async signOut(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.currentState.isEdge) {
        // For Edge, just clear local state
        this.clearStoredToken().then(() => {
          this.updateState({
            isAuthenticated: false,
            user: null,
            token: null,
            isEdge: this.currentState.isEdge
          });
          resolve();
        }).catch(reject);
        return;
      }

      if (!chrome.identity) {
        reject(new Error('Chrome Identity API not available'));
        return;
      }

      const token = this.currentState.token;
      if (!token) {
        resolve();
        return;
      }

      chrome.identity.removeCachedAuthToken({ token }, async () => {
        try {
          await this.clearStoredToken();
          this.updateState({
            isAuthenticated: false,
            user: null,
            token: null,
            isEdge: this.currentState.isEdge
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async getUserInfo(token: string): Promise<User> {
    const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${token}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return await response.json();
  }

  private async storeToken(token: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ authToken: token }, resolve);
    });
  }

  private async getStoredToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['authToken'], (result) => {
        resolve(result.authToken || null);
      });
    });
  }

  private async clearStoredToken(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['authToken'], resolve);
    });
  }

  private updateState(newState: AuthState) {
    this.currentState = newState;
    this.listeners.forEach(listener => listener(newState));
  }

  getState(): AuthState {
    return { ...this.currentState };
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Create singleton instance
export const authService = new ChromeAuthService();

// React hook for authentication
import { useState, useEffect } from 'react';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    signIn: () => authService.signIn(),
    signOut: () => authService.signOut()
  };
}
