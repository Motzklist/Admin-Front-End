/**
 * @fileoverview API-Based Authentication Provider (credentials)
 *
 * The default provider: username/password authentication and session checks via
 * the existing Next.js `/api/auth/*` proxy routes (which forward to the Go
 * backend). This is the admin's original behaviour, now behind the AuthProvider
 * strategy interface.
 *
 * @module services/auth/api-provider
 */

import * as api from '@/services/api';
import type { AuthCredentials, AuthProvider, AuthUser } from './types';

export class ApiAuthProvider implements AuthProvider {
  readonly name = 'api';
  readonly method = 'credentials' as const;

  async signInWithCredentials(credentials: AuthCredentials): Promise<AuthUser> {
    const res = await api.login({ username: credentials.username, password: credentials.password });
    return { userid: res.userid, username: res.username, role: res.role };
  }

  async getSession(): Promise<AuthUser | null> {
    try {
      const status = await api.checkAuth();
      if (status.authenticated && status.userid && status.username) {
        return { userid: status.userid, username: status.username, role: status.role };
      }
      return null;
    } catch {
      return null;
    }
  }

  async signOut(): Promise<void> {
    await api.logout();
  }
}
