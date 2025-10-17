# Fase de Investigación

## 1. Modelado de amenazas y seguridad por diseño

- Se aplicaron los modelos STRIDE y DREAD para identificar posibles actores, activos vulnerables y vectores de ataque.  
- Los principales riesgos detectados incluyen suplantación de identidad, interceptación de tráfico, fuga de información local y acceso indebido por privilegios excesivos.  
- Se propone un enfoque de seguridad por diseño, donde la protección se integra desde la fase inicial del desarrollo.  
- Se recomienda la adopción de frameworks como Zero Trust Architecture y RBAC (Role-Based Access Control) para garantizar que cada usuario tenga únicamente los permisos mínimos necesarios.  
- Los principios de confidencialidad, integridad y disponibilidad (CIA) se aplicarán en todas las capas de la aplicación.



## 2. Autenticación multifactor (MFA) y gestión de sesiones

- Se evaluaron las soluciones de autenticación en la nube más utilizadas: Firebase Auth, AWS Cognito y Azure AD B2C.  
- Para el proyecto Reserva Médica App, se selecciona Firebase Auth por su compatibilidad con React Native y facilidad de integración.  
- La aplicación implementará MFA combinando contraseña y código TOTP generado por aplicaciones como Google Authenticator.  
- Se utilizará la biometría local (huella o rostro) como factor adicional de verificación.  
- Las sesiones se gestionarán mediante tokens JWT con expiración corta, rotación periódica y revocación inmediata en caso de anomalías.  
- Se aplicará autenticación adaptativa, aumentando los controles según el nivel de riesgo del inicio de sesión (ubicación, IP o dispositivo).



## 3. Seguridad de API y cifrado de datos

- Todas las comunicaciones entre cliente y servidor se cifrarán con el protocolo TLS 1.3, garantizando confidencialidad e integridad.  
- Se aplicará la técnica de certificate pinning para prevenir ataques *man-in-the-middle* y validar la autenticidad de los certificados.  
- Se usará OAuth 2.0 con PKCE (Proof Key for Code Exchange) y soporte de OpenID Connect para autorización segura.  
- Los secretos (API Keys, tokens) se almacenarán de forma segura en GitHub Secrets, y en el cliente móvil mediante **Expo SecureStore / Keychain.  
- Los datos sensibles guardados localmente se cifrarán con el algoritmo AES-256, cumpliendo los estándares de seguridad empresarial.  
- Se limitará el acceso a los endpoints mediante autenticación, validaciones y políticas CORS configuradas en el backend.



## 4. Cumplimiento legal y privacidad

- Se revisaron las regulaciones aplicables al dominio del proyecto: GDPR (Unión Europea), CCPA/CPRA (California) y HIPAA (Estados Unidos), por tratar información médica.  
- Se establecerán políticas de consentimiento explícito antes de recopilar o procesar datos personales.  
- El usuario podrá exportar sus datos mediante un endpoint seguro (`/export-data`) y ejercer su derecho al olvido con la función (`/delete-account`).  
- Se garantizará la minimización de datos, almacenando únicamente la información estrictamente necesaria para el servicio.  
- La política de privacidad detallará cómo se procesan los datos, con transparencia y trazabilidad en cada tratamiento.  
- Se registrarán los accesos y modificaciones en los datos, cumpliendo con los requisitos de auditoría y trazabilidad exigidos por HIPAA.



## 5. DevSecOps y CI/CD modernos

- Se integrará la seguridad en todo el ciclo de vida del desarrollo (shift-left security).  
- El pipeline de CI/CD incluirá las siguientes etapas:  
  - SAST (Static Application Security Testing): análisis estático del código con Semgrep o eslint-security.  
  - SCA (Software Composition Analysis): revisión de vulnerabilidades en dependencias con OSV Scanner o npm audit.  
  - DAST (Dynamic Application Security Testing): escaneo del entorno staging con OWASP ZAP.  
  - Build automatizado:** mediante EAS Build con control de versiones.  
  - Despliegues progresivos: estrategias *Canary o Blue-Green Deployment para evitar interrupciones en producción.  
- Se utilizará infraestructura como código con herramientas compatibles (Terraform, GitHub Actions) para garantizar consistencia entre entornos.  
- La inteligencia artificial podrá apoyar en la detección de patrones anómalos o fallos en pruebas automatizadas.



## 6. Observabilidad y monitorización

- La observabilidad permitirá detectar incidentes y analizar el comportamiento de la aplicación en tiempo real.  
- Se recomienda integrar las siguientes herramientas:  
  - Sentry: para registrar errores y fallos en la app móvil.  
  - Firebase Analytics: para obtener métricas de uso y rendimiento.  
  - Prometheus + Grafana: para monitorear la infraestructura, latencia y disponibilidad.  
  - OpenTelemetry: para trazas distribuidas y correlación de eventos.  
- Se configurarán alertas automáticas ante:  
  - Aumento del crash rate (>1 % por hora).  
  - Latencia elevada en inicio de sesión (>400 ms).  
  - Picos de errores de autenticación o solicitudes fallidas.  
- Los paneles de monitoreo permitirán responder rápidamente a incidentes y mantener la continuidad operativa del sistema.



## 7. Herramientas de pruebas y análisis

- Para pruebas de seguridad y rendimiento se emplearán herramientas reconocidas a nivel empresarial:  
  - OWASP ZAP y Burp Suite para pruebas de penetración (*pentesting*).  
  - JMeter y k6 para pruebas de carga y estrés.  
  - OWASP MASVS como guía de cumplimiento de seguridad en apps móviles.  
- Se aplicarán pruebas automatizadas de cumplimiento normativo para validar conformidad con GDPR y HIPAA.  
- Los resultados esperados son:  
  - 0 vulnerabilidades críticas detectadas.  
  - Cumplimiento ≥ 90 % en privacidad y seguridad.  
  - Latencia media inferior a 400 ms en 100 RPS (peticiones por segundo).



## Tendencias emergentes

- **Infraestructura inmutable:** cada despliegue genera entornos nuevos, reduciendo errores humanos.  
- **Entornos efímeros (EaaS):** se crean y destruyen automáticamente para pruebas aisladas.  
- **IA en CI/CD:** prioriza la corrección de vulnerabilidades y optimiza tiempos de despliegue.  
- **Ética en automatización:** la inteligencia artificial debe aplicarse de forma responsable, garantizando equidad y protección de datos personales.



## Conclusiones

El análisis realizado demuestra que la aplicación de prácticas de seguridad avanzada, cumplimiento normativo y DevOps moderno permite fortalecer significativamente la protección de datos en *Reserva Médica App.  
Mediante autenticación multifactor, cifrado robusto, monitoreo activo y despliegues seguros, se asegura la confidencialidad, integridad y disponibilidad (CIA)** de la información.  
Estas estrategias cumplen los estándares técnicos de seguridad y las exigencias legales internacionales, contribuyendo a un desarrollo confiable, escalable y alineado con las mejores prácticas de 2025.

## Bibliografía

- OWASP Foundation. (2023). Mobile Application Security Verification Standard (MASVS). OWASP. https://mas.owasp.org/  
- Grassi, P. A., Richer, J. P., & Nadeau, E. M. (2020). NIST Special Publication 800-63B: Digital Identity Guidelines — Authentication and Lifecycle Management. National Institute of Standards and Technology. https://doi.org/10.6028/NIST.SP.800-63B  
- Internet Engineering Task Force (IETF). (2018). RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3. https://datatracker.ietf.org/doc/html/rfc8446  
- Google. (2024). Firebase Authentication Documentation. Google Cloud. https://firebase.google.com/docs/auth  
- European Union. (2016). General Data Protection Regulation (GDPR) (EU) 2016/679. Official Journal of the European Union. https://eur-lex.europa.eu/eli/reg/2016/679/oj  
