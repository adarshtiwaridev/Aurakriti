async function parseResponse(response) {
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Notification request failed');
  }
  return payload.data;
}

export async function getNotifications({ unreadOnly = false, limit = 20 } = {}) {
  const query = new URLSearchParams();
  if (unreadOnly) query.set('unreadOnly', 'true');
  if (limit) query.set('limit', String(limit));

  const response = await fetch(`/api/notifications${query.toString() ? `?${query.toString()}` : ''}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function markNotificationRead(id) {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    credentials: 'include',
  });

  return parseResponse(response);
}

export async function markAllNotificationsRead() {
  const response = await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    credentials: 'include',
  });

  return parseResponse(response);
}
