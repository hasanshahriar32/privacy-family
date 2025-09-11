import { API_CONFIG, DEFAULT_HEADERS, STORAGE_KEYS } from './config';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async getAuthToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.ACCESS_TOKEN], (result) => {
        resolve(result[STORAGE_KEYS.ACCESS_TOKEN] || null);
      });
    });
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await this.getAuthToken();

    const headers = {
      ...DEFAULT_HEADERS,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(API_CONFIG.TIMEOUT)
      });

      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 401) {
          // Token expired or invalid, clear storage
          await this.clearAuthData();
          throw new Error('Authentication expired. Please login again.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your connection.');
        }
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials)
      }
    );

    // Store token and user data if login successful
    if (response.success && response.data) {
      await this.storeAuthData(response.data.token, response.data.user);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      // Try to call logout endpoint if token exists
      const token = await this.getAuthToken();
      if (token) {
        await this.makeRequest(API_CONFIG.ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST'
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local data
      await this.clearAuthData();
    }
  }

  private async storeAuthData(token: string, user: any): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [STORAGE_KEYS.ACCESS_TOKEN]: token,
        [STORAGE_KEYS.USER_DATA]: user
      }, resolve);
    });
  }

  private async clearAuthData(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA
      ], resolve);
    });
  }

  async getStoredUser(): Promise<any | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEYS.USER_DATA], (result) => {
        resolve(result[STORAGE_KEYS.USER_DATA] || null);
      });
    });
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getAuthToken();
    const user = await this.getStoredUser();
    return !!(token && user);
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();
