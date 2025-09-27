SECURITY.md# SECURITY

## Principios aplicados

- Autenticación con Firebase (tokens de ID), todo tráfico por HTTPS.
- Almacenamiento local seguro: Expo SecureStore (Keychain/Keystore).
- Claves/API Keys fuera del repo (`.env`), uso de `EXPO_PUBLIC_*` solo para cliente.
- Mínimos privilegios: la API Key de Google Maps restringida por plataforma y API.

## Amenazas y mitigaciones

- **Fuga de tokens** → SecureStore + logout elimina token; no se loggea en consola.
- **Claves en repositorio** → `.env` + `.gitignore`; rotación en GCP si hay exposición.
- **Intercepción de tráfico** → HTTPS; rechazo de endpoints inseguros.
- **Permisos de ubicación** → Solicitud explícita y manejo de denegación.
- **Pérdida de dispositivo** → Token expira en backend de Firebase; revocación desde consola.

## Lineamientos

- No subir `.env` ni capturas con claves.
- Rotar claves si se comparten fuera del equipo.
- Revisar permisos antes de release (Android/iOS).
