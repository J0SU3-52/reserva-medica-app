export type WeatherResult = {
    temp: number;
    description: string;
    city: string;
};

export async function getWeatherByCoords(
    lat: number,
    lon: number
): Promise<WeatherResult> {
    const key = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;


    if (!key) throw new Error("Falta EXPO_PUBLIC_OPENWEATHER_API_KEY");


    let url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=es`;

    let res = await fetch(url);


    if (res.status === 401) {
        console.warn("⚠️ Error 401 con lat/lon, probando con q=Tehuacan...");
        url = `https://api.openweathermap.org/data/2.5/weather?q=Tehuacan&appid=${key}&units=metric&lang=es`;
        res = await fetch(url);
    }

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Error en API: ${res.status} → ${errorText}`);
    }

    const data = await res.json();

    return {
        temp: data.main?.temp ?? 0,
        description: data.weather?.[0]?.description ?? "sin descripción",
        city: data.name ?? "",
    };
}
