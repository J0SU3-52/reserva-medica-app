// src/services/http.secure.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const httpSecure = axios.create({ timeout: 10000 });

httpSecure.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    const headers =
      config.headers instanceof AxiosHeaders ? config.headers : new AxiosHeaders(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
    if (__DEV__) {
      const val = headers.get('Authorization');
      console.log('[httpSecure] Authorization:', val ? String(val).slice(0, 22) + '…' : 'none');
    }
  }
  return config;
});

httpSecure.interceptors.response.use(
  (res) => res,
  async (error) => {
    // 👇 algunos 401 cross-origin no exponen response.status; toma fallback del request
    const s = Number(error?.response?.status ?? error?.request?.status ?? 0);
    if (s === 401 || s === 403) {
      console.warn('[httpSecure] 401/403 → signOut()');
      try { await signOut(auth); } catch {}
    } else {
      console.warn('[httpSecure] error no-auth:', s || error?.message);
    }
    return Promise.reject(error);
  }
);
