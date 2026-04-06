import { createContext } from 'react';
import type { LoginPayload } from '../lib/api';
import type { AuthUser } from '../lib/api';

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
