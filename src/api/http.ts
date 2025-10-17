// src/api/http.ts
import { Platform } from "react-native";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { ENV } from "../lib/env";
import axios from "axios";

// ==============================
//  Tipos para react-native-ssl-pinning
// ==============================
type SSLPinningConfig = {
  certs?: string[];
  publicKeyHashes?: string[];
};
type NativeAxiosConfig = AxiosRequestConfig & {
  sslPinning?: SSLPinningConfig;
  trustSSL?: boolean;
};

// ==============================
//  Utilidades
// ==============================
function assert(condition: any, message: string): asserts condition {
  if (!condition) throw new Error(`[http] ${message}`);
}

function isHttps(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function sanitizePins(...pins: Array<string | undefined>) {
  return pins.map((p) => (p ?? "").trim()).filter((p) => p.length > 0);
}

// ==============================
//  Cliente por plataforma
// ==============================
const isNative = Platform.OS === "android" || Platform.OS === "ios";
const axiosLib: AxiosInstance = isNative
  ? require("react-native-ssl-pinning").default
  : require("axios").default;

// ==============================
//  Validaciones de entorno
// ==============================
assert(ENV.API_BASE_URL, "ENV.API_BASE_URL es requerido");
assert(isHttps(ENV.API_BASE_URL), "API_BASE_URL debe ser HTTPS");

const PIN_PRIMARY = ENV.API_PIN_SHA256;
const PIN_BACKUP = ENV.API_PIN_BACKUP_SHA256 || ""; // ✅ valor opcional seguro

const pins = sanitizePins(PIN_PRIMARY, PIN_BACKUP);

if (isNative) {
  assert(pins.length >= 1, "ENV.API_PIN_SHA256 es requerido para SSL Pinning");
  pins.forEach((p) => {
    assert(
      p.length >= 40 && p.length <= 60,
      "API_PIN_SHA256 parece inválido (esperado: SHA-256 en base64)"
    );
  });
}

// ==============================
//  Config base
// ==============================
const BASE_CONFIG: AxiosRequestConfig = {
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

// ==============================
//  Config nativa con pinning
// ==============================
const NATIVE_EXTRA: NativeAxiosConfig | undefined = isNative
  ? {
      ...BASE_CONFIG,
      sslPinning: {
        certs: [], // no usamos .cer
        publicKeyHashes: pins, // aquí van tus SPKI SHA-256 base64
      },
      trustSSL: true,
    }
  : undefined;

// ==============================
//  Cliente final
// ==============================
const client: AxiosInstance = isNative
  ? axiosLib.create(NATIVE_EXTRA as AxiosRequestConfig)
  : axiosLib.create(BASE_CONFIG);

export const http = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
});
