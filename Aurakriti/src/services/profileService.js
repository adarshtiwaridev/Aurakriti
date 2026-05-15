import { authorizedFetch, authorizedJsonFetch } from '@/services/http';
async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Profile request failed');
  }

  return payload.data;
}

export async function getProfile() {
  const response = await authorizedFetch('/api/auth/profile', {
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function getDashboardProfile() {
  const response = await authorizedFetch('/api/user/profile', {
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function updateProfile(payload) {
  const response = await authorizedJsonFetch('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export const uploadImages = async (files, folder) => {
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  console.log("TOKEN:", token);

  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("folder", folder);

  const response = await fetch("/api/upload/images", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }

  return data.data;
};
