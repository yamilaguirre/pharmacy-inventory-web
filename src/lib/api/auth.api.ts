import { authHeaders, request } from '../request';

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
    headers: authHeaders(token),
  });
}
