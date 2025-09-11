import { apiClient, LoginRequest } from './api-client';

// User interface to match backend response
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional computed properties for UI
  name?: string;
  avatar?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: true
  };

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const isAuthenticated = await apiClient.isAuthenticated();
      if (isAuthenticated) {
        const user = await apiClient.getStoredUser();
        if (user) {
          const enhancedUser = this.enhanceUser(user);
          this.updateState({
            isAuthenticated: true,
            user: enhancedUser,
            loading: false
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    }
    
    this.updateState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  }

  private enhanceUser(user: User): User {
    return {
      ...user,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.username || user.email.split('@')[0],
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}` 
          : user.username || user.email
      )}&background=0D8ABC&color=fff`
    };
  }

  async signIn(email: string, password: string): Promise<User> {
    // Input validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    this.updateState({
      ...this.currentState,
      loading: true
    });

    try {
      const credentials: LoginRequest = { email, password };
      const response = await apiClient.login(credentials);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      const enhancedUser = this.enhanceUser(response.data.user);
      
      this.updateState({
        isAuthenticated: true,
        user: enhancedUser,
        loading: false
      });

      return enhancedUser;
    } catch (error) {
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.updateState({
      ...this.currentState,
      loading: true
    });

    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
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

  // Additional method to refresh user data
  async refreshUser(): Promise<void> {
    try {
      const isAuthenticated = await apiClient.isAuthenticated();
      if (isAuthenticated) {
        const user = await apiClient.getStoredUser();
        if (user) {
          const enhancedUser = this.enhanceUser(user);
          this.updateState({
            isAuthenticated: true,
            user: enhancedUser,
            loading: false
          });
          return;
        }
      }
      
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    } catch (error) {
      console.error('Error refreshing user:', error);
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  }
}

// Create singleton instance
export const authService = new AuthService();

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
    signOut: () => authService.signOut(),
    refreshUser: () => authService.refreshUser()
  };
}
