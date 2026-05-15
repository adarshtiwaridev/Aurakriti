import { authorizedFetch } from '@/services/http';

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

  const response = await authorizedFetch(`/api/notifications${query.toString() ? `?${query.toString()}` : ''}`, {
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function markNotificationRead(id) {
  const response = await authorizedFetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
  });

  return parseResponse(response);
}

export async function markAllNotificationsRead() {
  const response = await authorizedFetch('/api/notifications/read-all', {
    method: 'PATCH',
  });

  return parseResponse(response);
}
