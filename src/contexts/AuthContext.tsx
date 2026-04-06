import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMe, login as apiLogin } from '../lib/api';
import type { AuthUser, LoginPayload } from '../lib/api';
import { decodeToken, getToken, removeToken, saveToken } from '../lib/token';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, restore session from localStorage if a valid token exists
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const decoded = decodeToken(token);
    const exp = decoded?.exp as number | undefined;
    const isExpired = exp ? Date.now() / 1000 > exp : false;

    if (isExpired) {
      removeToken();
      setIsLoading(false);
      return;
    }

    fetchMe(token)
      .then(setUser)
      .catch(() => removeToken())
      .finally(() => setIsLoading(false));
  }, []);

  async function login(payload: LoginPayload): Promise<void> {
    const { access_token } = await apiLogin(payload);
    saveToken(access_token);
    const me = await fetchMe(access_token);
    setUser(me);
  }

  function logout(): void {
    removeToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
