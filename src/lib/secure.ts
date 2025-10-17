import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Carga perezosa y tolerante
let EncryptedStorage: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  EncryptedStorage = require("react-native-encrypted-storage");
} catch (_) {
  EncryptedStorage = null;
}

const hasEncrypted =
  Platform.OS !== "web" &&
  EncryptedStorage &&
  typeof EncryptedStorage.setItem === "function";

export const secrets = {
  async set(key: string, value: string) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  get: (key: string) => SecureStore.getItemAsync(key),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};

export const secureData = {
  async set(key: string, value: unknown) {
    const payload = JSON.stringify(value);
    if (hasEncrypted) return EncryptedStorage.setItem(key, payload);
    // Fallback temporal: dividir en chunks si son grandes, o usar solo SecureStore si es pequeño
    return SecureStore.setItemAsync(key, payload);
  },
  async get<T = any>(key: string): Promise<T | null> {
    const raw = hasEncrypted
      ? await EncryptedStorage.getItem(key)
      : await SecureStore.getItemAsync(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async remove(key: string) {
    if (hasEncrypted) return EncryptedStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
  async clearAllBusinessData() {
    if (hasEncrypted) return EncryptedStorage.clear();
    // En fallback no hay “clear” global → borra claves que uses (o espera al Dev Client)
  },
};
