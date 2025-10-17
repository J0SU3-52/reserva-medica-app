// src/api/interceptor.ts

import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { Platform } from "react-native";
import { secrets } from "../storage/secure-repo";
import { navigateToLogin } from "../navigation/helpers";

// --- TIPADO: agregamos la marca _retry al config de Axios ---
declare module "axios" {
  // Si tu TS es estricto, esto evita el error en config._retry
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// ---- Claves centralizadas para tokens ----
const SECURE_KEYS = {
  accessToken: "session:accessToken",
  refreshToken: "session:refreshToken",
};

// ---- Base URL ----
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://example.invalid"; // fallback seguro por si falta

// ⚠️ Importante: aquí usamos axios "normal".
// Nada de opciones nativas (pinning) porque en Expo Go no existen.
// Cuando tengas Dev Client/APK, el cliente con pinning puedes crearlo en otro archivo y exportarlo según bandera.

if (!axios || typeof (axios as any).create !== "function") {
  console.error("axios import (tipo):", typeof axios, "valor:", axios);
  throw new Error(
    "[setup] axios es undefined o no tiene .create(). Revisa imports en TODO el proyecto: usa \"import axios from 'axios'\"."
  );
}

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

// ========== REQUEST: inyectar Authorization ==========
http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secrets.get(SECURE_KEYS.accessToken);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization =
      `Bearer ${token}`;
  }
  return config;
});

// ========== RESPONSE: refresh token / logout ==========

let refreshing = false;
let waiters: Array<() => void> = [];

async function refreshToken(): Promise<void> {
  if (refreshing) {
    // Ya hay un refresh en curso; esperamos
    await new Promise<void>((res) => waiters.push(res));
    return;
  }

  refreshing = true;
  try {
    const rt = await secrets.get(SECURE_KEYS.refreshToken);
    if (!rt) throw new Error("No refresh token");

    // Usamos axios "base" para evitar recursión de interceptores
    const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: rt,
    });

    const newAT = res.data?.accessToken as string | undefined;
    const newRT = res.data?.refreshToken as string | undefined;
    if (!newAT) throw new Error("No access token in refresh");

    await secrets.set(SECURE_KEYS.accessToken, newAT);
    if (newRT) await secrets.set(SECURE_KEYS.refreshToken, newRT);
  } finally {
    refreshing = false;
    // Despertamos a los que esperaban
    waiters.forEach((fn) => fn());
    waiters = [];
  }
}

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const cfg = error.config as InternalAxiosRequestConfig | undefined;

    // 401: intentamos un refresh UNA sola vez
    if (status === 401 && cfg && !cfg._retry) {
      try {
        cfg._retry = true;
        await refreshToken();

        const newAT = await secrets.get(SECURE_KEYS.accessToken);
        cfg.headers = cfg.headers ?? {};
        (cfg.headers as Record<string, string>).Authorization =
          `Bearer ${newAT ?? ""}`;

        // Reintentamos la original con el nuevo AT
        return http(cfg);
      } catch {
        // Refresh falló → limpiamos y mandamos a Login
        await Promise.all([
          secrets.remove(SECURE_KEYS.accessToken),
          secrets.remove(SECURE_KEYS.refreshToken),
        ]);
        navigateToLogin();
      }
    }

    // 403 u otros casos según tu política
    if (status === 403) {
      await Promise.all([
        secrets.remove(SECURE_KEYS.accessToken),
        secrets.remove(SECURE_KEYS.refreshToken),
      ]);
      navigateToLogin();
    }

    return Promise.reject(error);
  }
);
