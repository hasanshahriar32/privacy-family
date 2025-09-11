// Simple Manual Authentication Service
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

class SimpleAuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    isAuthenticated: false,
    user: null
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Check if user is already stored
    const user = await this.getStoredUser();
    if (user) {
      this.updateState({
        isAuthenticated: true,
        user
      });
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    // Simple validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create user object
    const user: User = {
      id: this.generateUserId(email),
      email: email,
      name: email.split('@')[0], // Use email prefix as name
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=0D8ABC&color=fff`
    };

    // Store user
    await this.storeUser(user);
    
    this.updateState({
      isAuthenticated: true,
      user
    });

    return user;
  }

  async signOut(): Promise<void> {
    await this.clearStoredUser();
    this.updateState({
      isAuthenticated: false,
      user: null
    });
  }

  private generateUserId(email: string): string {
    // Simple ID generation based on email
    return btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private async storeUser(user: User): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ currentUser: user }, resolve);
    });
  }

  private async getStoredUser(): Promise<User | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['currentUser'], (result) => {
        resolve(result.currentUser || null);
      });
    });
  }

  private async clearStoredUser(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['currentUser'], resolve);
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
export const authService = new SimpleAuthService();

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
    signIn: (email: string, password: string) => authService.signIn(email, password),
    signOut: () => authService.signOut()
  };
}
