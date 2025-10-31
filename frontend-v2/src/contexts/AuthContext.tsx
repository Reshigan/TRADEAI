import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../api/services/auth';
import { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const loadUser = async () => {
      // Check if authenticated
      if (authService.isAuthenticated()) {
        try {
          // Try to get stored user first for fast load
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
          
          // Then verify and get fresh data from server
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Clear all auth data on error
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    loadUser();
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
