import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refreshToken');
    const isAuthRoute = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && refreshToken && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await api.post('/auth/refresh', { refreshToken });
        if (refreshResponse.data.success) {
          const { token, user } = refreshResponse.data.data;
          localStorage.setItem('token', token);
          if (user) localStorage.setItem('user', JSON.stringify(user));
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
