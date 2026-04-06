import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMe, login as apiLogin } from '../lib/api';
import type { AuthUser, LoginPayload } from '../lib/api';
import { decodeToken, getToken, removeToken, saveToken } from '../lib/token';
import { AuthContext } from './auth.context';

/**
 * Check localStorage synchronously during component initialization.
 * This avoids calling setState inside the useEffect body (lint: react-hooks/set-state-in-effect).
 */
function resolveInitialLoading(): boolean {
  const token = getToken();
  if (!token) return false;

  const decoded = decodeToken(token);
  const exp = decoded?.exp as number | undefined;
  const isExpired = exp ? Date.now() / 1000 > exp : false;

  if (isExpired) {
    removeToken();
    return false;
  }

  return true; // valid token found — we need to fetch the user
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  // Lazy initializer runs once synchronously — no setState inside effect body
  const [isLoading, setIsLoading] = useState<boolean>(resolveInitialLoading);

  useEffect(() => {
    if (!isLoading) return;

    const token = getToken();
    if (!token) return;

    fetchMe(token)
      .then(setUser)
      .catch(() => removeToken())
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
