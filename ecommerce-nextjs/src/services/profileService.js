async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Profile request failed');
  }

  return payload.data;
}

export async function getProfile() {
  const response = await fetch('/api/auth/profile', {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function getDashboardProfile() {
  const response = await fetch('/api/user/profile', {
    credentials: 'include',
    cache: 'no-store',
  });

  return parseResponse(response);
}

export async function updateProfile(payload) {
  const response = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}

export async function uploadImages(files, folder = 'products') {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  formData.append('folder', folder);

  const response = await fetch('/api/upload/images', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  return parseResponse(response);
}
