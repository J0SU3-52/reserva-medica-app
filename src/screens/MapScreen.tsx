// src/screens/MapScreen.tsx
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen() {
    const [region, setRegion] = useState<Region | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            const loc = await Location.getCurrentPositionAsync({});
            setRegion({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02
            });
        })();
    }, []);

    if (!region) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_GOOGLE}
                initialRegion={region}
            >
                <Marker coordinate={region} title="Mi ubicación" />
            </MapView>
        </View>
    );
}
