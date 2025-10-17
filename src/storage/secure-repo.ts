import EncryptedStorage from "react-native-encrypted-storage";
import * as SecureStore from "expo-secure-store";

export type Json = Record<string, any> | any[];

const JSON_PREFIX = "json:"; // útil para inspecciones controladas en debug

/** ---- Secretos pequeños (tokens) ---- **/
export const secrets = {
  async set(key: string, value: string) {
    // iOS: accesibilidad cuando el dispositivo está desbloqueado
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async get(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async remove(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

/** ---- Datos de negocio (JSON medianos) ---- **/
export const secureData = {
  async set<T extends Json>(key: string, value: T) {
    const payload = JSON_PREFIX + JSON.stringify(value);
    await EncryptedStorage.setItem(key, payload);
  },

  async get<T = any>(key: string): Promise<T | null> {
    const raw = await EncryptedStorage.getItem(key);
    if (!raw) return null;
    // sanity check
    if (!raw.startsWith(JSON_PREFIX)) return null;
    return JSON.parse(raw.slice(JSON_PREFIX.length));
  },

  async remove(key: string) {
    await EncryptedStorage.removeItem(key);
  },

  async clearAllBusinessData() {
    // IMPORTANTE: no borra SecureStore; úsalo solo para datos de negocio.
    await EncryptedStorage.clear();
  },
};
