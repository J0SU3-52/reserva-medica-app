// src/services/auth.ts
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  type User,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";

// ✅ EncryptedStorage wrapper (AES-256-GCM con Keystore/Keychain)
import {
  saveSecure,
  getSecure,
  deleteSecure,
  clearAllSecure,
  SECURE_KEYS,
} from "../lib/secure";

const cleanEmail = (s: string) =>
  s.normalize("NFKC").replace(/\s/g, "").toLowerCase();

/**
 * Devuelve un ID token FRESH y lo guarda cifrado.
 * Úsalo cuando necesites garantizar vigencia del token (p.ej. antes de llamar a tu API).
 */
export async function refreshAuthToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");
  const token = await user.getIdToken(true); // fuerza refresh
  await saveSecure(SECURE_KEYS.authToken, token);
  return token;
}

/**
 * Devuelve el token almacenado (si existe). Si no hay, intenta refrescarlo si el usuario está logueado.
 */
export async function getAuthToken(): Promise<string | null> {
  const stored = await getSecure<string>(SECURE_KEYS.authToken);
  if (stored) return stored;
  if (auth.currentUser) {
    try {
      return await refreshAuthToken();
    } catch {
      return null;
    }
  }
  return null;
}

export async function login(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      cleanEmail(email),
      password
    );
    // 🔐 Guarda token cifrado
    const token = await cred.user.getIdToken(true);
    await saveSecure(SECURE_KEYS.authToken, token);
    return cred.user;
  } catch (e: any) {
    const code = e?.code || "";
    if (
      code.includes("wrong-password") ||
      code.includes("invalid-credential") ||
      code.includes("user-not-found")
    ) {
      throw new Error("Credenciales inválidas");
    }
    throw new Error("No se pudo iniciar sesión");
  }
}

export async function register(email: string, password: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      cleanEmail(email),
      password
    );
    // 🔐 Guarda token inicial cifrado
    const token = await cred.user.getIdToken(true);
    await saveSecure(SECURE_KEYS.authToken, token);
    return cred.user;
  } catch (e: any) {
    const code = e?.code || "";

    if (code.includes("email-already-in-use")) {
      throw new Error("El correo ya está registrado");
    }
    if (code.includes("weak-password")) {
      throw new Error("La contraseña es muy débil");
    }
    if (code.includes("invalid-email")) {
      throw new Error("Correo electrónico inválido");
    }

    throw new Error("No se pudo crear la cuenta");
  }
}

// LOGOUT OPTIMIZADO
export async function logout(): Promise<void> {
  try {
    const user = auth.currentUser;
    console.log("🚪 Iniciando logout para usuario:", user?.email);

    // 🔐 Limpiar token cifrado antes del signOut
    await deleteSecure(SECURE_KEYS.authToken);

    const logoutPromise = signOut(auth);

    // Timeout para evitar bloqueos
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout en logout")), 5000);
    });

    await Promise.race([logoutPromise, timeoutPromise]);

    console.log("✅ Logout completado exitosamente");
  } catch (error: any) {
    console.error("❌ Error en logout:", error);

    // Si falla el logout, forzar limpieza local
    if (
      error.message === "Timeout en logout" ||
      error.code === "auth/network-request-failed"
    ) {
      console.warn("⚠️ Logout timeout, limpiando estado local");
      // Forzar limpieza del estado de auth
      (auth as any).currentUser = null;
      throw new Error("Sesión cerrada localmente (error de red)");
    }

    throw error;
  }
}

// LOGOUT RÁPIDO ALTERNATIVO
export async function fastLogout(): Promise<void> {
  try {
    console.log("⚡ Ejecutando logout rápido...");

    // 1) 🔐 Limpiar TODO lo cifrado
    await clearAllSecure();

    // 2) Forzar signOut sin esperar respuesta
    const logoutPromise = signOut(auth).catch(() => {
      console.log("⚠️ Ignorando error en signOut rápido");
    });

    // 3) Limpiar usuario actual inmediatamente
    (auth as any).currentUser = null;

    // 4) No esperar, considerar logout completado
    setTimeout(() => logoutPromise, 1000);

    console.log("✅ Logout rápido completado");
  } catch (error) {
    console.warn("⚠️ Error en logout rápido, continuando...", error);
  }
}

// Función para limpiar caché de Firebase (útil en web)
export async function clearFirebaseCache(): Promise<void> {
  try {
    await setPersistence(auth, browserSessionPersistence);
    console.log("✅ Cache de Firebase limpiado");
  } catch (error) {
    console.warn("⚠️ No se pudo limpiar cache de Firebase:", error);
  }
}

// Función para enviar verificación de email
export async function sendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuario no autenticado");

  if (user.emailVerified) {
    throw new Error("El email ya está verificado");
  }

  await sendEmailVerification(user);
}

// Estado de verificación
export function isEmailVerified(): boolean {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
}

export function getEmailVerificationStatus(): {
  verified: boolean;
  email: string | null;
} {
  const user = auth.currentUser;
  return {
    verified: user?.emailVerified || false,
    email: user?.email || null,
  };
}

// Estado de autenticación
export function getAuthState(): {
  isAuthenticated: boolean;
  user: User | null;
} {
  return {
    isAuthenticated: !!auth.currentUser,
    user: auth.currentUser,
  };
}

// Debug
export const debugAuthState = () => {
  const user = auth.currentUser;
  console.log("🔍 Debug Auth State:", {
    user: user ? user.uid : "null",
    email: user?.email,
    emailVerified: user?.emailVerified,
    provider: user?.providerId,
  });
};

export const listenAuth = (cb: (u: User | null) => void) =>
  onAuthStateChanged(auth, cb);
