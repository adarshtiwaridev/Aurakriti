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

function normalizeOrderPayload(data) {
  if (!data) {
    return data;
  }

  if (Array.isArray(data.orders)) {
    return {
      ...data,
      orders: data.orders,
    };
  }

  if (data.order) {
    return data.order;
  }

  return data;
}

export async function getOrders(view) {
  const query = view ? `?view=${encodeURIComponent(view)}` : '';
  const response = await fetch(`/api/orders${query}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await parseResponse(response);
  return normalizeOrderPayload(data);
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

  const data = await parseResponse(response);
  return normalizeOrderPayload(data);
}

export async function getOrderById(orderId) {
  const response = await fetch(`/api/orders/${orderId}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  const data = await parseResponse(response);
  return normalizeOrderPayload(data);
}

export async function generateInvoiceForOrder(orderId) {
  const response = await fetch('/api/invoice/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ orderId }),
  });

  return parseResponse(response);
}
