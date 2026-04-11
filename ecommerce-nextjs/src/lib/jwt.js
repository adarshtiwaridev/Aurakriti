import jwt from 'jsonwebtoken';

const AUTH_COOKIE_NAME = 'ecocommerce_auth';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return process.env.JWT_SECRET;
};

export const generateToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

export const getTokenFromRequest = (req) => {
  const cookieToken = req.cookies?.get(AUTH_COOKIE_NAME)?.value;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};
