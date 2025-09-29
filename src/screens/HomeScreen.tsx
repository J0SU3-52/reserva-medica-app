import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { logout } from '../services/auth';
import { clearToken } from '../storage/secure';
import WeatherCard from '../components/WeatherCard';

export default function HomeScreen({ navigation }: any) {
    const [showWeather, setShowWeather] = useState(false);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text>Usuario autenticado ✅</Text>

            {/* Botón para mostrar/ocultar clima */}
            <Button
                title={showWeather ? "Ocultar clima" : "Verificar clima"}
                onPress={() => setShowWeather((prev) => !prev)}
            />

            {/* Tarjeta del clima */}
            {showWeather && <WeatherCard />}

            {/* Botón para abrir mapa */}
            <Button
                title="Abrir mapa"
                onPress={() => navigation.navigate('Map')}
            />

            <Button
                title="Cerrar sesión"
                color="red"
                onPress={async () => {
                    await logout();
                    await clearToken();
                }}
            />
        </View>
    );
}
