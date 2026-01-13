import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { userStorage, initializeDemoData } from '../services/storage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initializeDemoData();
    const currentUser = userStorage.getCurrent();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = async (username: string, password: string, role: string): Promise<boolean> => {
    const users = userStorage.getAll();
    const foundUser = users.find(
      u => u.username === username && u.password === password && u.role === role
    );

    if (foundUser) {
      foundUser.lastLogin = new Date().toISOString();
      userStorage.update(foundUser);
      userStorage.setCurrent(foundUser);
      setUser(foundUser);
      return true;
    }

    return false;
  };

  const logout = () => {
    userStorage.clearCurrent();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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

