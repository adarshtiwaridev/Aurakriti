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
  const response = await fetch(`/api/products${query ? `?${query}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function getProduct(id) {
  const response = await fetch(`/api/products/${id}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function createProduct(product) {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(product),
  });

  return parseResponse(response);
}

export async function updateProduct(id, product) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(product),
  });

  return parseResponse(response);
}

export async function deleteProduct(id) {
  const response = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  return parseResponse(response);
}
