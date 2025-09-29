# SECURITY

## Principios aplicados
- Autenticación con Firebase (tokens de ID), todo tráfico por **HTTPS**.
- Almacenamiento local seguro con **Expo SecureStore** (Keychain/Keystore nativo).
- Claves/API Keys fuera del repo (`.env`), uso de variables `EXPO_PUBLIC_*` solo en cliente.
- Principio de mínimos privilegios: la API Key de Google Maps restringida por plataforma y API.
- Validación de entradas de usuario antes de guardarlas o enviarlas a servicios externos.
- Manejo de errores sin exponer información sensible (ej. nunca mostrar stacktrace en UI).

## Amenazas y mitigaciones
- **Fuga de tokens** → SecureStore + logout elimina token; no se loggea en consola.
- **Claves en repositorio** → `.env` + `.gitignore`; rotación inmediata en caso de exposición.
- **Intercepción de tráfico** → HTTPS obligatorio; rechazo de endpoints inseguros.
- **Permisos de ubicación** → Solicitud explícita y manejo de denegación en tiempo de ejecución.
- **Pérdida de dispositivo** → Tokens expiran en Firebase; se pueden revocar desde consola.
- **Dependencias inseguras** → auditoría con `npm audit` y actualización constante.
- **Intentos de fuerza bruta** → Firebase aplica límites automáticos de reintentos y bloqueo temporal.

## Lineamientos
- Revisar permisos y configuraciones antes de cada release (Android/iOS).
- Usar solo dependencias confiables y revisadas por el equipo.
- Hacer PR con revisión obligatoria para validar que no se expongan claves ni datos sensibles.
