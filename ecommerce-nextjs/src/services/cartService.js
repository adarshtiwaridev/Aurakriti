async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Cart request failed');
  }

  return payload.data;
}

export async function addToCart(productId, quantity = 1) {
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });

  return parseResponse(response);
}

export async function fetchCart() {
  const response = await fetch('/api/cart', {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function updateCartItem(id, quantity) {
  const response = await fetch('/api/cart', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id, quantity }),
  });

  return parseResponse(response);
}

export async function removeCartItem(id) {
  const response = await fetch('/api/cart', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ id }),
  });

  return parseResponse(response);
}

export async function clearServerCart() {
  const response = await fetch('/api/cart', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ clearAll: true }),
  });

  return parseResponse(response);
}
