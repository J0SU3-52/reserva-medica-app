// src/services/auth.ts
import { auth } from '../lib/firebase';
import {
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
      // Aquí sí devolvemos un mensaje normalizado para Login
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
    // IMPORTANTE: no envolver el error; deja pasar el `code` de Firebase
    if (e?.code) throw e;
    const err = new Error('No se pudo crear la cuenta');
    (err as any).code = 'unknown';
    throw err;
  }
}

export const logout = () => signOut(auth);
export const listenAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);
