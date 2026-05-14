import { apiRequest, buildApiHeaders } from '@/services/apiClient';

export async function addToCart(productId, quantity = 1) {
  return apiRequest('/api/cart', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function fetchCart() {
  return apiRequest('/api/cart', {
    cache: 'no-store',
  });
}

export async function updateCartItem(id, quantity) {
  return apiRequest('/api/cart', {
    method: 'PATCH',
    body: JSON.stringify({ id, quantity }),
  });
}

export async function removeCartItem(id) {
  return apiRequest('/api/cart', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
}

export async function clearServerCart() {
  return apiRequest('/api/cart', {
    method: 'DELETE',
    body: JSON.stringify({ clearAll: true }),
  });
}
