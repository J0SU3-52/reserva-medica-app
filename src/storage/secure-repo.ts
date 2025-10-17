import * as SecureStore from "expo-secure-store";

export type Json = Record<string, any> | any[];

// Prefijo opcional para diferenciar datos JSON
const JSON_PREFIX = "json:";

/** ---- Secretos pequeños (tokens, claves, credenciales) ---- **/
export const secrets = {
  async set(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error("Error al guardar secreto:", error);
    }
  },

  async get(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("Error al obtener secreto:", error);
      return null;
    }
  },

  async remove(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("Error al eliminar secreto:", error);
    }
  },
};

/** ---- Datos de negocio (JSON medianos) ---- **/
export const secureData = {
  async set<T extends Json>(key: string, value: T) {
    try {
      const payload = JSON_PREFIX + JSON.stringify(value);
      await SecureStore.setItemAsync(key, payload);
    } catch (error) {
      console.error("Error al guardar datos:", error);
    }
  },

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (!raw) return null;
      if (!raw.startsWith(JSON_PREFIX)) return null;
      return JSON.parse(raw.slice(JSON_PREFIX.length));
    } catch (error) {
      console.error("Error al obtener datos:", error);
      return null;
    }
  },

  async remove(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("Error al eliminar datos:", error);
    }
  },

  async clearAllBusinessData(keys: string[]) {
    // Limpia solo las claves que especifiques
    for (const key of keys) {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
