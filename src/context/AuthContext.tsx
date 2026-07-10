/**
 * @fileoverview Authentication Context Provider
 *
 * Provides authentication state and methods throughout the admin application.
 * Manages admin user session with enhanced security features.
 *
 * @module context/AuthContext
 *
 * @example
 * ```tsx
 * const { isAuthenticated, user, login, logout } = useAuth();
 *
 * if (!isAuthenticated) {
 *   await login('admin', 'password');
 * }
 * ```
 */
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { User } from '@/types/api';
import { getAuthProvider } from '@/services/auth';
import type { AuthMethod } from '@/services/auth/types';

/**
 * Shape of the authentication context value
 */
interface AuthContextType {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current user information (null if not authenticated) */
  user: User | null;
  /** Whether authentication state is being loaded */
  isLoading: boolean;
  /** Which sign-in family the active provider uses (drives the sign-in UI). */
  authMethod: AuthMethod;
  /** Human-readable name of the active provider (e.g. 'api', 'google'). */
  providerName: string;
  /** Credential login. Valid when authMethod === 'credentials'. */
  login: (username: string, password: string) => Promise<void>;
  /** Begins a redirect sign-in (navigates away). Valid when authMethod === 'redirect'. */
  loginWithProvider: () => void;
  /** Logout function */
  logout: () => Promise<void>;
  /** Refresh authentication status */
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Wraps the application to provide authentication state and methods.
 * Automatically checks authentication status on mount.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // The active authentication strategy. getAuthProvider() is module-cached, so
  // this is a stable reference across renders.
  const provider = getAuthProvider();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check authentication status via the active provider.
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      const sessionUser = await provider.getSession();
      if (sessionUser) {
        setIsAuthenticated(true);
        setUser({
          userid: sessionUser.userid,
          username: sessionUser.username,
          role: sessionUser.role || 'admin',
        });
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [provider]);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  /**
   * Login function
   *
   * @param username - Admin username
   * @param password - Admin password
   * @throws {Error} If login fails
   */
  const login = async (username: string, password: string) => {
    if (!provider.signInWithCredentials) {
      throw new Error(
        `Auth provider "${provider.name}" does not support password login. ` +
          `Use loginWithProvider() for redirect-based sign-in.`,
      );
    }
    // Delegates to the active provider (backend, or the mock store when mocks
    // are enabled). Errors propagate to the sign-in form so invalid credentials
    // are reported to the user.
    const response = await provider.signInWithCredentials({ username, password });

    setIsAuthenticated(true);
    setUser({
      userid: response.userid,
      username: response.username,
      role: response.role || 'admin',
    });
  };

  /**
   * Begins a redirect (third-party) sign-in by navigating to the active
   * provider's start URL. The admin's server route runs the OAuth round-trip and
   * returns the user to the app, where the mount check picks up the session.
   */
  const loginWithProvider = () => {
    if (!provider.getSignInUrl) {
      throw new Error(`Auth provider "${provider.name}" is not a redirect provider.`);
    }
    window.location.assign(provider.getSignInUrl({ returnTo: '/' }));
  };

  /**
   * Logout function
   *
   * Clears authentication state and calls logout endpoint.
   */
  const logout = async () => {
    try {
      await provider.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with local logout even if API call fails
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  /**
   * Refresh authentication status
   *
   * Useful for checking if session is still valid.
   */
  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    authMethod: provider.method,
    providerName: provider.name,
    login,
    loginWithProvider,
    logout,
    refreshAuth,
  };

  // Show nothing while loading to prevent flash of wrong content
  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 *
 * @throws {Error} If used outside AuthProvider
 * @returns Authentication context value
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAuthenticated, user, logout } = useAuth();
 *
 *   return (
 *     <div>
 *       {isAuthenticated ? (
 *         <>
 *           <p>Welcome, {user?.username}!</p>
 *           <button onClick={logout}>Logout</button>
 *         </>
 *       ) : (
 *         <p>Please log in</p>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

