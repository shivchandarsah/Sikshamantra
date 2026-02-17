/* frontend/src/helper/axios.js */
import axios from "axios";

// ================= AXIOS INSTANCE =================
const axiosInstance = axios.create({
  baseURL:
    import.meta.env.PROD
      ? "https://your-production-domain.com/api/v1" // ✅ PROD HTTPS
      : "http://localhost:5005/api/v1",             // ✅ DEV HTTP
  withCredentials: true, // ✅ send httpOnly cookies automatically
});

// ================= REQUEST INTERCEPTOR =================
axiosInstance.interceptors.request.use(
  (config) => {
    // ✅ Ensure cookies are sent with every request
    config.withCredentials = true;
    
    // ✅ Also try to get token from cookies and add to Authorization header as fallback
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
    
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error("Axios Request Error:", error);
    return Promise.reject(error);
  }
);

// ================= RESPONSE INTERCEPTOR =================
let retryCount = 0;
const MAX_RETRIES = 2;
let isRefreshing = false;
let failedQueue = [];
let hasRedirected = false; // Prevent multiple redirects

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    // Reset retry count on successful response
    retryCount = 0;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      const { status, data } = error.response;
      const url = error.config?.url || '';

      // ✅ Handle 401 Unauthorized - Try to refresh token
      if (status === 401 && !originalRequest._retry) {
        // Don't try to refresh on login, register, refresh-token, or verify-email endpoints
        const excludedUrls = ['/login', '/register', '/refresh-token', '/verify-email', '/forgot-password', '/reset-password'];
        const shouldSkipRefresh = excludedUrls.some(excludedUrl => url.includes(excludedUrl));
        
        if (shouldSkipRefresh) {
          // For these endpoints, just reject without refresh attempt
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => {
              return axiosInstance(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Try to refresh the access token
          console.log('🔄 Access token expired, attempting refresh...');
          const refreshResponse = await axiosInstance.post('/users/refresh-token');
          
          if (refreshResponse.status === 200) {
            console.log('✅ Token refreshed successfully');
            isRefreshing = false;
            processQueue(null);
            
            // Retry the original request
            return axiosInstance(originalRequest);
          } else {
            throw new Error('Refresh token failed');
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError.response?.data?.message || refreshError.message);
          isRefreshing = false;
          processQueue(refreshError, null);
          
          // Clear any existing tokens
          document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          // Only redirect if not already on login page and haven't redirected yet
          if (!window.location.pathname.includes('/auth/login') && !hasRedirected) {
            hasRedirected = true;
            console.log('🔐 Redirecting to login page...');
            setTimeout(() => {
              window.location.href = '/auth/login';
            }, 100);
          }
          
          return Promise.reject(refreshError);
        }
      }

      // ✅ Suppress expected errors to reduce console noise
      const shouldSuppressError = (
        status === 401 || // Expected when not logged in
        (status === 404 && url.includes('/appointments/get-appointment/')) // Expected when no appointment exists
      );

      if (!shouldSuppressError) {
        console.error("Axios Response Error:", {
          status,
          message: data?.message,
          url,
          timestamp: new Date().toISOString()
        });
      }
      
      // Retry on 5xx server errors (but not on 4xx client errors)
      if (status >= 500 && status < 600 && retryCount < MAX_RETRIES && !originalRequest._retry) {
        retryCount++;
        originalRequest._retry = true;
        console.log(`🔄 Retrying request (${retryCount}/${MAX_RETRIES}):`, url);
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        
        return axiosInstance(originalRequest);
      }
    } else if (error.request) {
      // Network error - no response received
      console.error("Axios Network Error:", {
        message: error.message,
        url: error.config?.url,
        timestamp: new Date().toISOString()
      });
      
      // Retry on network errors
      if (retryCount < MAX_RETRIES && !originalRequest._retry) {
        retryCount++;
        originalRequest._retry = true;
        console.log(`🔄 Retrying after network error (${retryCount}/${MAX_RETRIES})`);
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        
        return axiosInstance(originalRequest);
      }
    } else {
      console.error("Axios Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
