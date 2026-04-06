const KEY = 'pharmacy_token';

export function saveToken(token: string): void {
  localStorage.setItem(KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(KEY);
}

export function removeToken(): void {
  localStorage.removeItem(KEY);
}

/**
 * Decode the JWT payload without verifying the signature.
 * Verification happens on the server — here we only read the claims.
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
