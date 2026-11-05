import axios from 'axios';
import { auth } from '../config/firebaseConfig';

export const apiClient = axios.create();

apiClient.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('A signed-in Firebase user is required for API requests.');
  }

  config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return config;
});

export async function apiFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('A signed-in Firebase user is required for API requests.');
  }

  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
  });
}
