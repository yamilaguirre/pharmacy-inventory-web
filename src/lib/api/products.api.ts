import { authHeaders, request } from '../request';
import type { Category } from './categories.api';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  price: string;
  requiresPrescription: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
}

export interface CreateProductPayload {
  name: string;
  sku: string;
  price: string;
  categoryId: string;
  description?: string;
  barcode?: string;
  requiresPrescription?: boolean;
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  active?: boolean;
}

export function fetchProducts(token: string): Promise<Product[]> {
  return request('/api/products', { headers: authHeaders(token) });
}

export function createProduct(token: string, payload: CreateProductPayload): Promise<Product> {
  return request('/api/products', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateProduct(
  token: string,
  id: string,
  payload: UpdateProductPayload,
): Promise<Product> {
  return request(`/api/products/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteProduct(token: string, id: string): Promise<Product> {
  return request(`/api/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
