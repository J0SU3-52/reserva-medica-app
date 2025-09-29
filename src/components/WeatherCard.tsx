import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { getWeatherByCoords, WeatherResult } from '../services/weather';

export default function WeatherCard() {
    const [data, setData] = useState<WeatherResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Permiso de ubicación denegado');
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({});
                const wx = await getWeatherByCoords(loc.coords.latitude, loc.coords.longitude);
                setData(wx);
            } catch (e: any) {
                setError(e?.message || 'Error al obtener clima');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <View style={{ margin: 16, padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Clima actual</Text>
            {loading && <ActivityIndicator />}
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
            {data && (
                <Text>
                    {data.city ? `${data.city} · ` : ''}🌡️ {data.temp}°C · {data.description}
                </Text>
            )}
        </View>
    );
}
