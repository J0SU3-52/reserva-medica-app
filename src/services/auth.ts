import { auth } from '../lib/firebase';
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

const cleanEmail = (s: string) =>
  s.normalize('NFKC').replace(/\s/g, '').toLowerCase();

export async function login(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail(email), password);
    await cred.user.getIdToken(true);
    return cred.user;
  } catch (e: any) {
    const code = e?.code || '';
    if (
      code.includes('wrong-password') ||
      code.includes('invalid-credential') ||
      code.includes('user-not-found')
    ) {
      throw new Error('Credenciales inválidas');
    }
    throw new Error('No se pudo iniciar sesión');
  }
}

export async function register(email: string, password: string): Promise<User> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail(email), password);
    await cred.user.getIdToken(true);
    return cred.user;
  } catch (e: any) {
    const code = e?.code || '';
    
    if (code.includes('email-already-in-use')) {
      throw new Error('El correo ya está registrado');
    }
    if (code.includes('weak-password')) {
      throw new Error('La contraseña es muy débil');
    }
    if (code.includes('invalid-email')) {
      throw new Error('Correo electrónico inválido');
    }
    
    throw new Error('No se pudo crear la cuenta');
  }
}

export async function sendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  
  if (user.emailVerified) {
    throw new Error('El email ya está verificado');
  }
  
  await sendEmailVerification(user);
}

export function isEmailVerified(): boolean {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
}

export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  
  await sendEmailVerification(user);
}

export function getEmailVerificationStatus(): { verified: boolean; email: string | null } {
  const user = auth.currentUser;
  return {
    verified: user?.emailVerified || false,
    email: user?.email || null
  };
}

export const logout = () => signOut(auth);
export const listenAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);
