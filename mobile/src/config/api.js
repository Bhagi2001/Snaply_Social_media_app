import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Use your machine's IP for physical device, localhost for simulator
const getBaseUrl = () => {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envApiUrl) {
    return envApiUrl.replace(/\/+$/, '');
  }

  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
    const expoHost = hostUri ? hostUri.split(':')[0] : null;

    // Web browser
    if (Platform.OS === 'web') {
      return 'http://localhost:5000/api';
    }

    // Expo Go on physical device should call the host machine over LAN.
    if (expoHost) {
      return `http://${expoHost}:5000/api`;
    }

    // Android emulator uses 10.0.2.2, iOS simulator uses localhost
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
  return 'https://your-production-api.com/api';
};

export const BASE_URL = getBaseUrl();
export const SOCKET_URL = getBaseUrl().replace('/api', '');

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          await AsyncStorage.setItem('accessToken', accessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // The auth context will handle redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default api;
