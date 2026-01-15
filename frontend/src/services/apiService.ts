import type { User } from '../types';

// API base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Generic fetch function with error handling
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  const response = await fetch(url, mergedOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Auth API functions
export const authAPI = {
  login: async (username: string, password: string, role: string): Promise<{ token: string; user: User }> => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    });
  },

  getCurrentUser: async (token: string): Promise<User> => {
    return fetchAPI('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Storage for token
export const tokenStorage = {
  get: (): string | null => {
    return localStorage.getItem('authToken');
  },
  set: (token: string): void => {
    localStorage.setItem('authToken', token);
  },
  remove: (): void => {
    localStorage.removeItem('authToken');
  },
};