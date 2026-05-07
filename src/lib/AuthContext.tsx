"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  user: { username: string; name: string } | null;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; name: string } | null>(null);

  // Check local storage on mount to persist mock session
  useEffect(() => {
    const stored = localStorage.getItem('mock_auth');
    if (stored) {
      setIsAuthenticated(true);
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = () => {
    const mockUser = { username: 'janedoe', name: 'Jane Doe' };
    setIsAuthenticated(true);
    setUser(mockUser);
    localStorage.setItem('mock_auth', JSON.stringify(mockUser));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('mock_auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
