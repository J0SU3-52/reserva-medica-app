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

## Pruebas (piramide)

- Unitarias (Jest/XCTest/JUnit).
- Integración (Jest/Supertest).
- E2E (Cypress/Detox).
- Seguridad y regresión.

## CI/CD (GitHub Actions)

- CI al abrir PR a `develop`: lint + unit + integración + auditoría deps.
- Auto-deploy a **Staging** tras merge a `develop`.
- Tag y Release al aprobar `release/*` → `main`. Monitoreo y rollback (hotfix).
