import { authHeaders, request } from '../request';

export interface Category {
  id: string;
  name: string;
}

export function fetchCategories(token: string): Promise<Category[]> {
  return request('/api/categories', { headers: authHeaders(token) });
}

export function createCategory(token: string, name: string): Promise<Category> {
  return request('/api/categories', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
}
