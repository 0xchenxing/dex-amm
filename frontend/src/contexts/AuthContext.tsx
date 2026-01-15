import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { userStorage, initializeDemoData } from '../services/storage';
import { authAPI, tokenStorage } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDemoData();
    
    // Check if we have a token and try to get user info
    const checkAuth = async () => {
      const token = tokenStorage.get();
      if (token) {
        try {
          const fetchedUser = await authAPI.getCurrentUser(token);
          setUser(fetchedUser);
          userStorage.setCurrent(fetchedUser);
        } catch {
          // Token is invalid or expired
          tokenStorage.remove();
          userStorage.clearCurrent();
        }
      } else {
        // Check for current user in session storage (backward compatibility)
        const currentUser = userStorage.getCurrent();
        if (currentUser) {
          setUser(currentUser);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    try {
      // Call backend API for login
      const response = await authAPI.login(username, password, role);
      
      // Store token
      tokenStorage.set(response.token);
      
      // Update user info
      const userWithLastLogin = {
        ...response.user,
        lastLogin: new Date().toISOString(),
      };
      
      // Store user in session storage for backward compatibility
      userStorage.setCurrent(userWithLastLogin);
      
      // Update state
      setUser(userWithLastLogin);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    // Clear token and user info
    tokenStorage.remove();
    userStorage.clearCurrent();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

