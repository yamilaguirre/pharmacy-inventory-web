export type Role = 'ADMIN' | 'PHARMACIST' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? '';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function fetchHealth(): Promise<{ status: string }> {
  return request('/api/health');
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchMe(token: string): Promise<AuthUser> {
  return request('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
