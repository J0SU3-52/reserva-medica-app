// src/lib/env.ts
type NonEmpty = string & { __brand: "NonEmpty" };

function required(name: string): NonEmpty {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`[env] Falta variable obligatoria: ${name}`);
  }
  return v.trim() as NonEmpty;
}

function optional(name: string, fallback = ""): string {
  const v = process.env[name];
  return (v ?? fallback).trim();
}

export const ENV = {
  // === API / Backend ===
  API_BASE_URL: required("EXPO_PUBLIC_API_BASE_URL"),
  API_PIN_SHA256: required("EXPO_PUBLIC_API_PIN_SHA256"),

  // 🔹 NUEVO: pin de respaldo (opcional). Si no existe en .env, queda "".
  API_PIN_BACKUP_SHA256: optional("EXPO_PUBLIC_API_PIN_BACKUP_SHA256", ""),

  // === Firebase (públicas) ===
  FIREBASE_API_KEY: required("EXPO_PUBLIC_FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: required("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: required("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  FIREBASE_STORAGE_BUCKET: required("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  FIREBASE_MESSAGING_SENDER_ID: required(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  ),
  FIREBASE_APP_ID: required("EXPO_PUBLIC_FIREBASE_APP_ID"),
} as const;

export type AppEnv = typeof ENV;
