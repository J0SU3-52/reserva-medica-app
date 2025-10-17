// src/services/weather.ts
import { http } from "../api/http";

export type WeatherResult = {
  temp: number;
  description: string;
  city: string;
};

const mapWeather = (data: any): WeatherResult => ({
  temp: data?.main?.temp ?? 0,
  description: data?.weather?.[0]?.description ?? "sin descripción",
  city: data?.name ?? "",
});

export async function getWeatherByCoords(
  lat: number,
  lon: number
): Promise<WeatherResult> {
  try {
    const { data } = await http.get("/weather", { params: { lat, lon } });
    return mapWeather(data);
  } catch (err: any) {
    const status = err?.response?.status;
    const text = err?.response?.data
      ? JSON.stringify(err.response.data)
      : String(err);
    throw new Error(
      `Error al consultar clima (coords) ${status ?? ""}: ${text}`
    );
  }
}

export async function getWeatherByCity(city: string): Promise<WeatherResult> {
  try {
    const { data } = await http.get("/weather", { params: { city } });
    return mapWeather(data);
  } catch (err: any) {
    const status = err?.response?.status;
    const text = err?.response?.data
      ? JSON.stringify(err.response.data)
      : String(err);
    throw new Error(`Error al consultar clima (city) ${status ?? ""}: ${text}`);
  }
}
