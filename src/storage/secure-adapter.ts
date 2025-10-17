// src/storage/secure-adapter.ts
import { secrets, secureData, type Json } from "./secure-repo";

export const SECURE_KEYS = {
  accessToken: "session:accessToken",
  refreshToken: "session:refreshToken",
  // agrega otros si los usabas antes
};

/**
 * Lee un dato seguro. Por defecto asume "secret" (tokens).
 */
export async function getSecure<T = string>(
  key: string,
  type: "secret" | "data" = "secret"
): Promise<T | string | null> {
  if (type === "secret") {
    return (await secrets.get(key)) as string | null;
  }
  return (await secureData.get<T>(key)) as T | null;
}

/**
 * Guarda un dato seguro.
 * - "secret": guarda SIEMPRE como string (tokens).
 * - "data": guarda como JSON (usa secureData).
 */
export async function saveSecure(
  key: string,
  value: string | Json,
  type: "secret" | "data" = "secret"
): Promise<void> {
  if (type === "secret") {
    const valStr: string = String(value ?? "");
    await secrets.set(key, valStr);
    return;
  }
  await secureData.set(key, value as Json);
}

/**
 * Limpieza total típica en logout/401.
 */
export async function clearAllSecure(): Promise<void> {
  try {
    await secrets.remove(SECURE_KEYS.accessToken);
    await secrets.remove(SECURE_KEYS.refreshToken);
  } catch {}
  try {
    await secureData.clearAllBusinessData();
  } catch {}
}
