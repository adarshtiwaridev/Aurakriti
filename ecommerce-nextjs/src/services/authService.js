import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const TOKEN_STORAGE_KEY = 'ecoCommerceToken';
const USER_STORAGE_KEY = 'ecoCommerceUser';

class AuthService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config?.url?.includes('/api/auth/me')) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );
  }

  getToken() {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  setToken(token) {
    if (typeof window === 'undefined' || !token) {
      return;
    }

    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }

  removeToken() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  getUser() {
    if (typeof window === 'undefined') {
      return null;
    }

    const user = window.localStorage.getItem(USER_STORAGE_KEY);

    if (!user) {
      return null;
    }

    try {
      return JSON.parse(user);
    } catch {
      this.removeUser();
      return null;
    }
  }

  setUser(user) {
    if (typeof window === 'undefined' || !user) {
      return;
    }

    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  removeUser() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(USER_STORAGE_KEY);
  }

  // Auth methods
  async login(credentials) {
    try {
      const response = await this.api.post('/api/auth/login', credentials);
      const payload = response.data?.data ?? {};

      this.setToken(payload.token);
      this.setUser(payload.user);

      return payload;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Login failed' };
    }
  }

  async demoLogin() {
    const user = {
      name: 'Cyber',
      email: 'cyber@demo.com',
      role: 'user',
      isVerified: true,
    };
    const token = 'demo-token-cyber-1234';

    this.setToken(token);
    this.setUser(user);

    return { user, token };
  }

  async register(userData) {
    try {
      const response = await this.api.post('/api/auth/register', userData);
      return response.data?.data ?? {};
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Registration failed' };
    }
  }

  async fetchMe() {
    try {
      const response = await this.api.get('/api/auth/me');
      const payload = response.data?.data ?? {};

      if (payload.user) {
        this.setUser(payload.user);
      }

      return payload;
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Failed to load session' };
    }
  }

  async logout() {
    try {
      await this.api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      this.removeToken();
      this.removeUser();
    }
  }

  async verifyEmail(email, otp) {
    try {
      const response = await this.api.post('/api/auth/verify', { email, otp });
      const currentUser = this.getUser();
      if (currentUser) {
        currentUser.isVerified = true;
        this.setUser(currentUser);
      }
      return response.data?.data ?? {};
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Verification failed' };
    }
  }

  async forgotPassword(email) {
    try {
      const response = await this.api.post('/api/auth/forgot-password', { email });
      return response.data?.data ?? {};
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Failed to send reset OTP' };
    }
  }

  async resetPassword(email, otp, password) {
    try {
      const response = await this.api.post('/api/auth/reset-password', {
        email,
        otp,
        password,
      });
      return response.data?.data ?? {};
    } catch (error) {
      throw error.response?.data || { message: error.message || 'Password reset failed' };
    }
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getCurrentUser() {
    return this.getUser();
  }

  // Check if user has specific role
  hasRole(role) {
    const user = this.getUser();
    return user && user.role === role;
  }

  // Check if user is admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Check if user is seller
  isSeller() {
    return this.hasRole('seller');
  }

  // Check if user is regular user
  isUser() {
    return this.hasRole('user');
  }
}

const authService = new AuthService();
export default authService;
