import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

// Quita TODOS los espacios (incluye invisibles), normaliza y pasa a minúsculas
const cleanEmail = (s: string) =>
  s
    .normalize('NFKC')   // normaliza caracteres raros
    .replace(/\s/g, '')  // elimina cualquier whitespace (incluye espacios de ancho cero)
    .toLowerCase();

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, cleanEmail(email), password);

export const register = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, cleanEmail(email), password);

export const logout = () => signOut(auth);

export const listenAuth = (cb: (u: User | null) => void) =>
  onAuthStateChanged(auth, cb);
