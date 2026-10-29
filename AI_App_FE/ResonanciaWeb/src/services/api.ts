import axios from 'axios';
import { auth } from './firebase';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const ASTROLOGY_API_KEY = 'ByNqfA4kvD1EBGyi6ZlUC8aekqCi7FgF8VuJ8SF1';
export const ASTROLOGY_BASE_URL = 'https://json.freeastrologyapi.com/western';

// Axios instance với auto auth token
const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// API functions
export const apiGenerate = (data: object) => api.post('/generate', data);
export const apiNatalAnalysis = (data: object) => api.post('/natal-analysis', data);
export const apiCompatibility = (data: object) => api.post('/compatibility-analysis', data);
export const apiLoveMatching = (type: string, data: object) => api.post(`/love-matching/${type}`, data);
export const apiLoveMatchingHistory = (uid: string, type: string) => api.get(`/love-matching/history/${uid}/${type}`);
export const apiUploadImage = (data: object) => api.post('/upload-image', data);
export const apiDeleteImage = (data: object) => api.post('/delete-image', data);
export const apiUpdateProfile = (data: object) => api.post('/update-profile', data);
export const apiSendMatchRequest = (data: object) => api.post('/send-match-request', data);
export const apiAcceptMatch = (data: object) => api.post('/accept-match-request', data);
export const apiRejectMatch = (data: object) => api.post('/reject-match-request', data);
export const apiBreakup = (data: object) => api.post('/breakup', data);
export const apiCheckMatchStatus = (uid1: string, uid2: string) => api.get(`/check-match-status?uid1=${uid1}&uid2=${uid2}`);
export const apiGetNotifications = (uid: string) => api.get(`/get-notifications?uid=${uid}`);
export const apiMarkNotificationRead = (data: object) => api.post('/mark-notification-read', data);
export const apiDeleteNotification = (data: object) => api.post('/delete-notification', data);
export const apiGetMatchRequests = (uid: string, type?: string) =>
  api.get(`/get-match-requests?uid=${uid}${type ? `&type=${type}` : ''}`);
