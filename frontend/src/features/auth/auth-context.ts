import { createContext } from 'react';
import type { AuthStatus, AuthUser } from './auth.types';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (token: string, user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
