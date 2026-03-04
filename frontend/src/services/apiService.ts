import type { User, LiquidityPool, Trade, SystemLog } from '../types/index';

// API base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Generic fetch function with error handling
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get auth token
  const token = await tokenStorage.get();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
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

// 系统日志相关 API
export const systemLogAPI = {
  getAll: async (): Promise<SystemLog[]> => {
    return fetchAPI('/system-logs');
  },
  getByCategory: async (category: string): Promise<SystemLog[]> => {
    return fetchAPI(`/system-logs/category/${category}`);
  },
  create: async (log: SystemLog): Promise<SystemLog> => {
    return fetchAPI('/system-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
};

// 用户相关 API
export const userAPI = {
  getAll: async (): Promise<User[]> => {
    return fetchAPI('/users');
  },
  getById: async (id: number): Promise<User> => {
    return fetchAPI(`/users/${id}`);
  },
  update: async (user: User): Promise<User> => {
    return fetchAPI(`/users/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },
  updateStatus: async (id: number, status: 'active' | 'inactive'): Promise<User> => {
    return fetchAPI(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

};

// 套利相关 API
export const arbitrageAPI = {
  getAll: async (): Promise<any[]> => {
    return fetchAPI('/arbitrage/opportunities');
  },
  execute: async (): Promise<void> => {
    return fetchAPI('/arbitrage/execute', {
      method: 'POST',
    });
  },
  toggleAutoTrading: async (enabled: boolean): Promise<void> => {
    return fetchAPI('/arbitrage/auto-trading', {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  },
};

// 治理相关 API
export const governanceAPI = {
  getAll: async (): Promise<any[]> => {
    return fetchAPI('/governance/proposals');
  },
  create: async (proposal: any): Promise<any> => {
    return fetchAPI('/governance/proposals', {
      method: 'POST',
      body: JSON.stringify(proposal),
    });
  },
  vote: async (proposalId: string, voteType: 'for' | 'against'): Promise<void> => {
    return fetchAPI(`/governance/proposals/${proposalId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ voteType }),
    });
  },
};

// 扩展交易相关 API
export const tradeAPI = {
  getAll: async (): Promise<Trade[]> => {
    return fetchAPI('/trades');
  },
  getByUser: async (userId: string): Promise<Trade[]> => {
    return fetchAPI(`/trades/user/${userId}`);
  },
  getById: async (id: string): Promise<Trade> => {
    return fetchAPI(`/trades/${id}`);
  },
  create: async (trade: Trade): Promise<Trade> => {
    return fetchAPI('/trades', {
      method: 'POST',
      body: JSON.stringify(trade),
    });
  },
  updateStatus: async (id: string, status: 'completed' | 'pending' | 'cancelled'): Promise<Trade> => {
    return fetchAPI(`/trades/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// 扩展流动性池相关 API
export const liquidityPoolAPI = {
  getAll: async (): Promise<LiquidityPool[]> => {
    return fetchAPI('/liquidity-pools');
  },
  getById: async (id: string): Promise<LiquidityPool> => {
    return fetchAPI(`/liquidity-pools/${id}`);
  },
  create: async (pool: LiquidityPool): Promise<LiquidityPool> => {
    return fetchAPI('/liquidity-pools', {
      method: 'POST',
      body: JSON.stringify(pool),
    });
  },
  update: async (pool: LiquidityPool): Promise<LiquidityPool> => {
    return fetchAPI(`/liquidity-pools/${pool.id}`, {
      method: 'PUT',
      body: JSON.stringify(pool),
    });
  },
  delete: async (id: string): Promise<void> => {
    return fetchAPI(`/liquidity-pools/${id}`, {
      method: 'DELETE',
    });
  },
};

// IndexedDB setup
async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('dex_amm', 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };
  });
}

// Storage for token
export const tokenStorage = {
  get: async (): Promise<string | null> => {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction('tokens', 'readonly');
        const store = transaction.objectStore('tokens');
        const request = store.get('authToken');

        request.onsuccess = () => {
          resolve(request.result?.token || null);
        };

        request.onerror = () => {
          resolve(null);
        };
      });
    } catch {
      return null;
    }
  },

  set: async (token: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('tokens', 'readwrite');
      const store = transaction.objectStore('tokens');
      const request = store.put({ id: 'authToken', token });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to store token'));
      };
    });
  },

  remove: async (): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('tokens', 'readwrite');
      const store = transaction.objectStore('tokens');
      const request = store.delete('authToken');

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to remove token'));
      };
    });
  },
};