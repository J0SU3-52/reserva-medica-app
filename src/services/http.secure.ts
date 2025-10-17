// src/services/http.secure.ts
import axios from 'axios';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { Platform } from 'react-native';
import { clearToken } from '../storage/secure';

export const httpSecure = axios.create({ 
  timeout: 15000,
});

httpSecure.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
    
    if (__DEV__) {
      console.log('[httpSecure] Token añadido');
    }
  }
  
  config.headers['X-Platform'] = Platform.OS;
  config.headers['X-App-Version'] = '1.0.0';
  
  return config;
});

httpSecure.interceptors.response.use(
  (response) => {
    if (response.headers['content-type'] && !response.headers['content-type'].includes('application/json')) {
      throw new Error('Respuesta inválida del servidor');
    }
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    
    console.warn(`[httpSecure] Error ${status}:`, error.message);
    
    if (status === 401 || status === 403) {
      console.warn('[httpSecure] Sesión expirada → logout()');
      try { 
        // Logout rápido sin bloquear la respuesta
        setTimeout(async () => {
          try {
            await signOut(auth);
            await clearToken();
            console.log('✅ Auto-logout por error de auth');
          } catch (logoutError) {
            console.error('Error en auto-logout:', logoutError);
          }
        }, 100);
      } catch (logoutError) {
        console.error('[httpSecure] Error durante logout:', logoutError);
      }
    }
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('La solicitud tardó demasiado. Intente nuevamente.');
    }
    
    if (error.message.includes('Network Error')) {
      throw new Error('Error de conexión. Verifique su internet.');
    }
    
    if (status >= 500) {
      throw new Error('Error del servidor. Intente más tarde.');
    }
    
    if (status >= 400 && status < 500) {
      throw new Error('Solicitud incorrecta. Verifique los datos.');
    }
    
    return Promise.reject(error);
  }
);

export default httpSecure;