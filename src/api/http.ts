// src/api/http.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ENV } from "../lib/env";

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

assert(ENV.API_BASE_URL, "ENV.API_BASE_URL es requerido");
assert(isHttps(ENV.API_BASE_URL), "API_BASE_URL debe ser HTTPS");

const BASE_CONFIG: AxiosRequestConfig = {
  baseURL: ENV.API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

const http: AxiosInstance = axios.create(BASE_CONFIG);

// 🔐 Pinning lógico — valida el dominio antes de la petición
http.interceptors.request.use(async (config) => {
  const allowedHosts = ["api.openweathermap.org", "reserva-medica-api.vercel.app"];
  const currentHost = new URL(config.baseURL || "").hostname;

  if (!allowedHosts.includes(currentHost)) {
    throw new Error(`Conexión bloqueada: dominio ${currentHost} no autorizado.`);
  }

  return config;
});

export { http };
