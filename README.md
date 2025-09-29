# App móvil de reservas médicas

## Metodología y equipo
- Metodología: **Scrum** (sprints, Review, Retro).
- Roles: PO (Oscar), SM (Josue), Frontend (Brayan), Backend/DevOps/QA (Miguel).
- Artefactos: Product Backlog, Sprint Backlog, Incremento.

## Estrategia de versionamiento (GitFlow)
- Ramas principales: `main` (estable), `develop` (integración).
- Soporte: `feature/*`, `release/*`, `hotfix/*`.
- Convención de ramas: `feature/login-2fa`, `feature/reservas`, etc.
- Commits: `feat: ...`, `fix: ...`, `docs: ...`
- Releases por sprint: `v0.1.0`, `v0.2.0` (SemVer).

## Entornos
- **Staging** (auto-deploy al merge en `develop`).
- **Producción** (deploy con aprobación; merge `release/*` → `main`).

## Pruebas (pirámide)
- Unitarias (Jest/XCTest/JUnit).
- Integración (Jest/Supertest).
- E2E (Cypress/Detox).
- Seguridad y regresión.

## CI/CD (GitHub Actions)
- CI al abrir PR a `develop`: lint + unit + integración + auditoría deps.
- Auto-deploy a **Staging** tras merge a `develop`.
- Tag y Release al aprobar `release/*` → `main`. Monitoreo y rollback (hotfix).

---

## Semana 2 – Seguridad y Consumo de API en la nube

### Requisitos
- Node 18+
- **Expo CLI** / **Expo Go** (Android/iOS)
- Cuenta en **Firebase**, **Google Maps** y **OpenWeather**

### Variables de entorno
Copiar `.env.example` a `.env` y completar con las credenciales del equipo:

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=changeme
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=changeme
EXPO_PUBLIC_FIREBASE_PROJECT_ID=changeme
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=changeme
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=changeme
EXPO_PUBLIC_FIREBASE_APP_ID=changeme

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=changeme

# OpenWeather
EXPO_PUBLIC_OPENWEATHER_API_KEY=changeme

### Instrucciones para correr la App

- Clonar e instalar dependencias: git clone <URL-DEL-REPO>
cd reserva-medica-app
npm install
- Configurar variables de entorno: 
cp .env.example .env
- Ejecutar
npx expo start -c

