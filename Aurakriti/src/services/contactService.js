import { apiRequest } from '@/services/apiClient';

export async function submitContactMessage(payload) {
  return apiRequest('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}