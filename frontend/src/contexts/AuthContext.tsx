import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authAPI, tokenStorage } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token and try to get user info
    const checkAuth = async () => {
      try {
        const token = await tokenStorage.get();
        if (token) {
          try {
            const fetchedUser = await authAPI.getCurrentUser(token);
            setUser(fetchedUser);
          } catch {
            // Token is invalid or expired
            await tokenStorage.remove();
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string, role: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Call backend API for login
      const response = await authAPI.login(username, password, role);
      
      // Store token
      await tokenStorage.set(response.token);
      
      // Update user info
      const userWithLastLogin = {
        ...response.user,
        lastLogin: new Date().toISOString(),
      };
      
      // Update state
      setUser(userWithLastLogin);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      
      // Extract error message from the error object
      let errorMessage = '登录失败，请检查用户名、密码或角色';
      if (error instanceof Error) {
        try {
          const errorData = JSON.parse(error.message);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If error message is not JSON, use it directly
          errorMessage = error.message;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    // Clear token and user info
    await tokenStorage.remove();
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

