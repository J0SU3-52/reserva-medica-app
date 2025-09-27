// src/storage/secure.ts
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
};

export const getToken = async () => SecureStore.getItemAsync(TOKEN_KEY);

export const clearToken = async () => SecureStore.deleteItemAsync(TOKEN_KEY);
