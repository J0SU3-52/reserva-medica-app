// src/storage/secure.ts
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user_data";

export const saveToken = async (token: string) => {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (error) {
    console.error('Error guardando token:', error);
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

export const clearToken = async (): Promise<void> => {
  try {
    console.log('🧹 Limpiando tokens almacenados...');
    
    // Limpiar múltiples claves por si acaso
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
      SecureStore.deleteItemAsync('firebase_token'),
    ]);
    
    console.log('✅ Tokens limpiados exitosamente');
  } catch (error) {
    console.error('❌ Error limpiando tokens:', error);
  }
};

// Limpieza completa de almacenamiento
export const clearAllStorage = async (): Promise<void> => {
  try {
    console.log('🧹 Limpiando todo el almacenamiento...');
    
    // Lista de posibles claves a limpiar
    const keysToClear = [
      TOKEN_KEY,
      USER_KEY,
      'firebase_token',
      'user_profile',
      'app_settings',
      'auth_state'
    ];
    
    const deletePromises = keysToClear.map(key => 
      SecureStore.deleteItemAsync(key).catch(() => { 
        console.log(`⚠️ No se pudo limpiar: ${key}`);
      })
    );
    
    await Promise.all(deletePromises);
    console.log('✅ Almacenamiento limpiado completamente');
  } catch (error) {
    console.warn('⚠️ Error en limpieza completa:', error);
  }
};