import axios from 'axios';
import { parseApiError } from '@/lib/utils/errors';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Get CSRF token from cookies
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/csrf_token=([^;]+)/);
  return match ? match[1] : null;
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Send cookies with requests
});

apiClient.interceptors.request.use((config) => {
  // Add CSRF token to header for state-changing requests
  const csrfToken = getCsrfToken();
  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }

  // Cookies are sent automatically with withCredentials: true
  // No need to set Authorization header anymore
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Parse error for structured logging
    const parsedError = parseApiError(error);

    // Log structured error info (helps with debugging)
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: parsedError.status,
        title: parsedError.title,
        message: parsedError.message,
        requestId: parsedError.requestId,
        validationErrors: parsedError.validationErrors,
      });
    }

    // Attach parsed error to error object for easy access
    error.parsedError = parsedError;

    const originalRequest = error.config;

    // Handle 401 Unauthorized - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Redirect to login if refresh fails
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // No need to set Authorization header, cookies are automatic
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint (cookies sent automatically)
        await apiClient.post('/auth/refresh');

        // Server sets new cookies automatically
        // Process queued requests
        processQueue(null, null);

        // Retry original request (new cookies will be sent automatically)
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        processQueue(refreshError, null);
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden (CSRF token invalid)
    if (error.response?.status === 403) {
      const detail = error.response?.data?.detail || '';
      if (detail.includes('CSRF')) {
        // CSRF token issue - try refreshing
        try {
          await apiClient.post('/auth/refresh');
          return apiClient(originalRequest);
        } catch {
          window.location.href = '/auth/login';
          return Promise.reject(error);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
