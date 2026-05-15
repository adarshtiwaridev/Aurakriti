const TOKEN_STORAGE_KEY = 'ecoCommerceToken';

function getStoredToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function buildHeaders(headers = {}, includeJson = false) {
  const nextHeaders = new Headers(headers);
  const token = getStoredToken();

  if (token && token !== 'cookie' && !nextHeaders.has('Authorization')) {
    nextHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (includeJson && !nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json');
  }

  return nextHeaders;
}

export async function authorizedFetch(input, init = {}) {
  const { headers, ...rest } = init;

  return fetch(input, {
    credentials: 'include',
    ...rest,
    headers: buildHeaders(headers, false),
  });
}

export async function authorizedJsonFetch(input, init = {}) {
  const { headers, ...rest } = init;

  return fetch(input, {
    credentials: 'include',
    ...rest,
    headers: buildHeaders(headers, true),
  });
}
