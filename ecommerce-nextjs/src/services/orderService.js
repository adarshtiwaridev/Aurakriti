async function parseResponse(response) {
  let payload = {};

  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Order request failed');
  }

  return payload.data;
}

export async function getOrders(view) {
  const query = view ? `?view=${encodeURIComponent(view)}` : '';
  const response = await fetch(`/api/orders${query}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function updateOrderStatus(orderId, status, itemId, trackingDetails) {
  const response = await fetch(`/api/orders/${orderId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status, itemId, trackingDetails }),
  });

  return parseResponse(response);
}

export async function getOrderById(orderId) {
  const response = await fetch(`/api/orders/${orderId}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}
