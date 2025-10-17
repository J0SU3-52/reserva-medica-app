// api/weather.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Proxy a OpenWeather para ocultar la API key del cliente.
 * Requiere: OPENWEATHER_API_KEY en Vercel (Project → Settings → Environment Variables).
 * Uso:
 *   GET /api/weather?city=Tehuacan
 *   GET /api/weather?lat=18.46&lon=-97.4
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS básico para clientes Expo/web
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  const API_KEY = process.env.OPENWEATHER_API_KEY;
  if (!API_KEY)
    return res.status(500).json({ error: "OPENWEATHER_API_KEY not set" });

  const { city, lat, lon } = req.query;

  if (!city && !(lat && lon)) {
    return res.status(400).json({ error: "city o lat/lon requeridos" });
  }

  const url = city
    ? `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        String(city)
      )}&appid=${API_KEY}&units=metric&lang=es`
    : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    return res.status(r.ok ? 200 : r.status).json(data);
  } catch (e: any) {
    return res
      .status(502)
      .json({ error: "Upstream error", detail: String(e?.message || e) });
  }
}
