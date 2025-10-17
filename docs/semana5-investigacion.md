
## Fase de investigacion 

Esta investigación presenta estrategias para fortalecer la seguridad, el cumplimiento normativo y las prácticas DevOps modernas en una aplicación móvil empresarial. Se analizan modelos de amenazas, autenticación multifactor (MFA), cifrado de datos y protocolos de comunicación seguros. Además, se revisan lineamientos de privacidad (GDPR y CCPA) y prácticas de DevSecOps como SAST, SCA, DAST y despliegues progresivos. Finalmente, se propone un esquema de observabilidad y monitorización con herramientas actuales.  
Las conclusiones servirán como base técnica para la implementación en el proyecto Reserva Médica App.

## 1. Introducción

El objetivo de esta investigación es establecer los fundamentos que permitirán integrar prácticas de seguridad avanzada, cumplimiento normativo y DevOps moderno en la app *Reserva Médica App*.  
Esta aplicación, creada con Expo/React Native y Firebase, incluye módulos de autenticación, mapas, clima y gestión de usuarios. La meta es garantizar la confidencialidad, integridad y disponibilidad de los datos mediante técnicas empresariales y metodologías modernas.



## 2. Metodología de investigación

Para elaborar este informe se consultaron fuentes oficiales y normas reconocidas, aplicando un enfoque sistemático basado en la comparación de herramientas y buenas prácticas.

**Fuentes principales:** OWASP MASVS, NIST SP 800-63, GDPR, CCPA, Firebase Auth, AWS Cognito, Azure AD B2C, OpenTelemetry, Sentry, Cloudflare y Auth0.  
**Criterios:** actualidad (2018–2025), aplicabilidad al entorno móvil y relevancia técnica.  
**Proceso:** investigación temática → comparación → síntesis → aplicación práctica al proyecto.  
**Limitaciones:** algunas técnicas, como el *certificate pinning*, requieren configuración nativa (EAS Build o prebuild).



## 3. Modelado de amenazas y seguridad por diseño

Se aplican los modelos STRIDE y DREAD para identificar riesgos y priorizarlos.

### Ejemplo de matriz STRIDE

| **Activo** | **Amenaza** | **Vector** | **Control propuesto** |
|-------------|-------------|-------------|-----------------------|
| Tokens de sesión | Spoofing / Replay | Reutilización de token robado | Rotación y expiración de tokens, almacenamiento cifrado (SecureStore) |
| API /appointments | Tampering | Inyección o manipulación de datos | Validación en servidor, scopes OIDC, rate limiting |
| Datos locales | Exposición de información | Acceso físico al dispositivo | Cifrado AES-256 antes de guardar |
| Tráfico de red | Interceptación | MITM o certificados falsos | TLS 1.3 + *certificate pinning* (si es viable) |



## 4. Autenticación multifactor (MFA) y gestión de sesiones

La autenticación multifactor combina varios factores (contraseña, posesión y biometría) para aumentar la seguridad.  
Se compararon tres servicios principales y se eligió el más compatible con el proyecto.

### Comparativa de proveedores de MFA

| **Criterio** | **Firebase Auth** | **AWS Cognito** | **Azure AD B2C** |
|--------------|------------------|-----------------|------------------|
| Factores disponibles | Password, SMS, TOTP (Authenticator) | Password, SMS/TOTP | Password, SMS/TOTP, integración empresarial |
| Integración con React Native | Excelente (SDK Expo) | Buena | Compleja |
| Gestión de sesión | Tokens con expiración y revocación | Amplia personalización | Enterprise |
| Coste y mantenimiento | Bajo | Escalable en AWS | Alto, corporativo |

**Decisión:**  
Se adopta Firebase Auth, implementando MFA con TOTP (Authenticator) como método principal y SMS como respaldo.  
La biometría (Expo Local Authentication) se usará como verificación local adicional.  

**Buenas prácticas de sesión:**  
- Tokens de corta duración y refresh tokens rotables.  
- Revocación inmediata de sesiones comprometidas.  
- Registro de auditoría de eventos (login, MFA, revocaciones).  
- Re-autenticación obligatoria en dispositivos nuevos o IPs sospechosas.


## 5. Seguridad de API y cifrado de datos

El proyecto requiere una comunicación segura entre cliente y servidor, así como protección de la información almacenada.

**Recomendaciones principales:**
- Usar OAuth 2.0 + PKCE para autorización segura.  
- Forzar TLS 1.3 en todas las comunicaciones.  
- Implementar *certificate pinning* si se migra a EAS Build.  
- Guardar secretos en GitHub Secrets y en el cliente con SecureStore.  
- Cifrar datos locales sensibles con AES-256 antes de almacenarlos.


## 6. Cumplimiento normativo y privacidad

Las normativas GDPR (Unión Europea) y CCPA/CPRA (California) exigen el consentimiento informado, la portabilidad y el derecho al olvido.  
La app debe permitir al usuario decidir sobre sus datos y ofrecer mecanismos para exportarlos o eliminarlos.

### Cuadro 3 – Matriz de cumplimiento (extracto)

| **Requisito** | **Control técnico** | **Control organizativo** | **Evidencia** |
|----------------|--------------------|---------------------------|----------------|
| Consentimiento | Modal + logs (versión, timestamp) | Política y registro del tratamiento | Capturas + tabla `consents` |
| Portabilidad | `/export-data` (paquete JSON/CSV) | Procedimiento de solicitud | PR + prueba e2e |
| Derecho al olvido | `/delete-account` | Proceso de borrado/retención | PR + acta de validación |



## 7 DevSecOps y CI/CD modernos

El enfoque DevSecOps busca integrar la seguridad en todo el ciclo de desarrollo.  
Se propone un pipeline con validaciones automáticas y despliegues controlados.

### Pipeline sugerido

| **Etapa** | **Herramienta / práctica** | **Objetivo** |
|------------|-----------------------------|---------------|
| SAST (análisis estático) | Semgrep / eslint-security | Detectar vulnerabilidades de código. |
| SCA (dependencias) | OSV Scanner / npm audit | Revisar librerías vulnerables. |
| DAST (análisis dinámico) | OWASP ZAP | Escanear entorno staging. |
| Build móvil | EAS Build | Generar versión por canal. |
| Despliegue progresivo | Feature Flags / Canary | Liberar versiones de forma controlada. |



## 8. Observabilidad y monitorización

La observabilidad permite detectar errores en tiempo real y reaccionar ante incidentes.

**Herramientas recomendadas:**  
- Sentry (Expo SDK): captura de errores y rendimiento.  
- Firebase Analytics: métricas de uso.  
- OpenTelemetry + Prometheus + Grafana: trazas y dashboards.  
- Alertas automáticas: picos de errores, latencia y fallos de autenticación.

### Cuadro 5 – Indicadores de monitoreo

| **Métrica** | **Umbral de alerta** | **Acción correctiva** |
|--------------|----------------------|------------------------|
| Crash rate de la app | > 1 % por hora | Rollback o revisión del canary |
| Latencia p95 /login | > 400 ms | Escalar backend o DB |
| Fallos de autenticación | > 10 en 10 min | Bloqueo temporal / revisión de logs |



## 9 Pruebas y análisis de seguridad

Las pruebas de seguridad y rendimiento garantizan que la aplicación sea confiable antes del despliegue final.

### Tipos de prueba y herramientas

| **Tipo de prueba** | **Herramienta** | **Objetivo** | **Criterio de éxito** |
|---------------------|-----------------|---------------|------------------------|
| Pentesting / DAST | OWASP ZAP, Burp Suite | Identificar vulnerabilidades OWASP Top 10 | 0 vulnerabilidades críticas |
| Rendimiento | JMeter / k6 | Evaluar escalabilidad y latencia | p95 < 400 ms en 100 RPS |
| Conformidad | OWASP MASVS, GDPR checklist | Validar cumplimiento normativo | Cumplimiento ≥ 90 % |



## 10. Tendencias emergentes

Las tendencias más recientes en seguridad móvil y DevOps incluyen:

- Infraestructura inmutable: entornos efímeros para pruebas aisladas.  
- IA en CI/CD: priorización automática de fallos y análisis predictivo.  
- Ética en automatización: revisión humana en decisiones que afectan datos de usuario.



## 11. Aplicación al proyecto Reserva Médica App

El conocimiento obtenido se aplicará directamente a la app del equipo mediante las siguientes acciones:

| **Área** | **Acción** | **Resultado esperado** |
|-----------|-------------|-------------------------|
| Identidad y sesiones | Activar MFA (TOTP) y revocación de tokens | Doble factor seguro |
| Transporte y cifrado | Implementar TLS 1.3 y plan de pinning | Comunicación cifrada |
| Secretos | Usar GitHub Secrets y SecureStore | Sin claves expuestas |
| Pipeline | Configurar workflows (lint, test, SAST, DAST) | CI/CD automatizado |
| Observabilidad | Integrar Sentry y Grafana | Alertas y métricas en tiempo real |
| Cumplimiento | Modal de consentimiento, /export y /delete endpoints | Derechos GDPR/CCPA activos |



## 12. Riesgos y mitigaciones

| **Riesgo** | **Descripción** | **Mitigación** |
|-------------|-----------------|----------------|
| Falta de pinning | Expo requiere módulo nativo | Migrar a EAS Build |
| Vulnerabilidad SMS MFA | Riesgo de SIM-swap | Usar TOTP o push |
| Datos sin cifrar | Acceso físico al dispositivo | Cifrado AES-256 + SecureStore |
| Tokens no rotados | Sesiones prolongadas | Expiración corta y revocación |



## Conclusiones

El fortalecimiento de la Reserva Médica App se apoya en un enfoque integral: MFA, PKCE, TLS 1.3, cifrado local y DevSecOps automatizado.  
Estas medidas garantizan la seguridad de la información, el cumplimiento normativo y un ciclo de despliegue estable y auditable.

---

## Bibliografía

- OWASP. (2023). *Mobile Application Security Verification Standard (MASVS)*. OWASP. Recuperado de https://mas.owasp.org/  
- Grassi, P. A., Richer, J. P., Squire, S. K., Fenton, J. L., Nadeau, E. M., et al. (2020). *NIST Special Publication 800-63B: Digital Identity Guidelines — Authentication and Lifecycle Management*. National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-63B  
- IETF. (2015). *RFC 7636: Proof Key for Code Exchange by OAuth Public Clients*. Recuperado de https://datatracker.ietf.org/doc/html/rfc7636  
- IETF. (2018). *RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3*. Recuperado de https://datatracker.ietf.org/doc/html/rfc8446  
- NowSecure. (2022). *An Essential Guide to the OWASP Mobile App Security (MAS) Project*. NowSecure. Recuperado de https://www.nowsecure.com/wp-content/uploads/2022/10/d4434ca2-498a-4fb1-a0bb-74ec5599c165.pdf  
