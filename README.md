# 📱 Reserva Médica App

Aplicación móvil desarrollada con **React Native (Expo)** para la gestión y reserva de citas médicas.  
Integra autenticación segura (Firebase), mapas (Google Maps API), clima (OpenWeather), cifrado local, y una arquitectura CI/CD moderna.

---

## 👥 Metodología y equipo

- **Metodología:** Scrum (sprints, Daily, Review, Retro)
- **Roles:**
  - Product Owner: Oscar  
  - Scrum Master: Josue  
  - Frontend: Brayan  
  - Backend / DevOps / QA: Miguel  
- **Artefactos:** Product Backlog, Sprint Backlog, Incremento funcional.

---

## 🌳 Estrategia de versionamiento (GitFlow)

- **Ramas principales:**  
  - `main` → estable / producción  
  - `develop` → integración y pruebas  

- **Soporte:**  
  - `feature/*` → nuevas funcionalidades  
  - `release/*` → versiones preparadas para entrega  
  - `hotfix/*` → correcciones urgentes  

- **Convenciones:**  
  - Branch: `feature/login-2fa`, `feature/maps`  
  - Commit: `feat: agrega MFA`, `fix: corrige error en SecureStore`  
  - Versionado SemVer: `v0.1.0`, `v0.2.0`, etc.

---

## 🧱 Entornos y despliegues

- **Staging:** auto-deploy al hacer merge en `develop`.  
- **Producción:** deploy aprobado desde `release/*` → `main`.  
- **Infraestructura:** CI/CD con GitHub Actions + Expo EAS + Firebase Hosting (backend).

---

## 🧪 Estrategia de pruebas (pirámide)

- **Unitarias:** Jest (hooks, lógica de servicios).  
- **Integración:** Supertest / Jest.  
- **E2E:** Detox (Android/iOS).  
- **Seguridad:** ZAP / MobSF / npm audit / Snyk.  
- **Regresión:** ejecución automática por workflow en cada PR.

---

## ⚙️ CI/CD (DevOps Moderno 2025)

- **Integración Continua (CI):**
  - Linter, auditoría de dependencias (Snyk, npm audit).
  - Pruebas unitarias y de integración.
  - Análisis estático de seguridad (CodeQL / Sonar).

- **Entrega Continua (CD):**
  - Deploy automático en Staging (Expo EAS).
  - Tag semántico y publicación de release en GitHub.
  - Despliegue a Producción bajo aprobación manual.
  - Rollback automatizado si el build falla.

- **Infraestructura como código (IaC):**
  - Definida en `.github/workflows/ci.yml` y `cd.yml`.
  - Secrets gestionados en GitHub Secrets (sin hardcodeo).

---

## 🔒 Seguridad avanzada (Fase 2)

### Diseño de seguridad
- **Cifrado local:** `expo-secure-store` y `react-native-encrypted-storage` (AES-256).
- **Cifrado en tránsito:** HTTPS + TLS 1.3 obligatorio.
- **Pinning lógico:** validación de dominios en `src/services/http.secure.ts`.
- **Gestión de sesiones:** tokens almacenados de forma segura y revocados al cerrar sesión.
- **Zero Trust Client:** validaciones adicionales (firma, timestamp, device check).
- **MFA (Autenticación multifactor):** implementado vía Firebase Auth + reCAPTCHA.

### Cumplimiento normativo
- **GDPR:** derecho al olvido y portabilidad en `SettingsScreen`.
- **CCPA/CPRA:** consentimiento explícito antes de guardar datos personales.
- **Política de privacidad y logs inmutables.**

---

## 🧩 Estructura del proyecto

src/
├─ api/
│ ├─ http.ts # Cliente API base
│ ├─ interceptor.ts # Interceptores para auth y errores
│
├─ navigation/
│ ├─ helpers.ts
│ └─ RootNavigator.tsx
│
├─ screens/
│ ├─ HomeScreen.tsx
│ ├─ LoginScreen.tsx
│ ├─ RegisterScreen.tsx
│ ├─ MapScreen.tsx
│ ├─ MapScreen.web.tsx
│ └─ SettingsScreen.tsx
│
├─ services/
│ ├─ auth.ts # Firebase Auth + refresh token
│ ├─ http.secure.ts # HTTPS + pinning lógico (TLS 1.3)
│ ├─ firebase.ts
│ ├─ mfa.ts
│ ├─ recaptcha.ts
│ ├─ weather.ts
│ └─ zeroTrust.ts # Validaciones extra en cliente
│
├─ storage/
│ ├─ secure-repo.ts # Cifrado AES-256 en SecureStore
│ ├─ secure-adapter.ts
│ ├─ secure.ts
│ └─ migrations.ts
│
├─ lib/
│ ├─ env.ts
│ ├─ firebase.ts
│ └─ secure.ts
│
└─ docs/
├─ tls-report.md # Evidencia de escaneo TLS
└─ verification.jpg # Capturas del pentest y API segura


---

## 🌍 Dependencias principales

- **React Native / Expo SDK 54**
- **Firebase Auth / Firestore**
- **Axios (API client)**
- **expo-secure-store**
- **react-native-encrypted-storage**
- **OpenWeather API**
- **Google Maps SDK**
- **Jest / Detox**
- **ZAP / MobSF / Snyk (seguridad)**

---

## ⚡ Instalación y ejecución

### Requisitos
- Node.js ≥ 18  
- Expo CLI  
- Android Studio o Expo Go  
- Cuenta Firebase + APIs activas (Maps, OpenWeather)

### Variables de entorno
Copia el archivo `.env.example` y reemplaza tus credenciales:

```bash
cp .env.example .env
