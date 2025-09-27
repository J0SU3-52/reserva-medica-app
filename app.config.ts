// app.config.ts (recomendado)
export default {
  expo: {
    name: "reserva-medica-app",
    slug: "reserva-medica-app",
    extra: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    ios: {
      supportsTablet: true,
      config: { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
    },
    android: {
      package: "com.j0su3.reservamedica",
      permissions: ["ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
      },
    },
  },
};
