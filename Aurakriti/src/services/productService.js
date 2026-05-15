import { authorizedFetch, authorizedJsonFetch } from '@/services/http';

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
};

async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Request failed');
  }

  return payload.data;
}

export async function getProducts(params = {}) {
  const query = buildQuery(params);
  const response = await authorizedFetch(`/api/products${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function getProduct(id) {
  const response = await authorizedFetch(`/api/products/${id}`, {
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function createProduct(product) {
  const isFormData = typeof FormData !== 'undefined' && product instanceof FormData;
  const response = await (isFormData
    ? authorizedFetch('/api/products', {
        method: 'POST',
        body: product,
      })
    : authorizedJsonFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(product),
      }));

  return parseResponse(response);
}

export async function updateProduct(id, product) {
  const isFormData = typeof FormData !== 'undefined' && product instanceof FormData;
  const response = await (isFormData
    ? authorizedFetch(`/api/products/${id}`, {
        method: 'PATCH',
        body: product,
      })
    : authorizedJsonFetch(`/api/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(product),
      }));

  return parseResponse(response);
}

export async function deleteProduct(id) {
  const response = await authorizedFetch(`/api/products/${id}`, {
    method: 'DELETE',
  });

  return parseResponse(response);
}

export async function createReview(productId, review) {
  const response = await authorizedJsonFetch(`/api/products/${productId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
  });

  return parseResponse(response);
}

export async function updateReview(productId, reviewId, review) {
  const response = await authorizedJsonFetch(`/api/products/${productId}/reviews`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewId, ...review }),
  });

  return parseResponse(response);
}

export async function deleteReview(productId, reviewId) {
  const response = await authorizedFetch(`/api/products/${productId}/reviews?reviewId=${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  });

  return parseResponse(response);
}
