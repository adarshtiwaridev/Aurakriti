const DEFAULT_DEV_URL = 'http://localhost:3000';

const normalizeBaseUrl = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

export const getAppUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!configuredUrl) {
    return DEFAULT_DEV_URL;
  }

  const normalized = normalizeBaseUrl(configuredUrl);
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  return `https://${normalized}`;
};

export const getAppUrlObject = () => new URL(getAppUrl());
