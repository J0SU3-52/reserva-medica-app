// __tests__/auth.service.test.ts
import * as Svc from '../src/services/auth';

jest.mock('firebase/auth', () => {
  return {
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
});

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';

const mockedSignIn = signInWithEmailAndPassword as jest.Mock;
const mockedCreate = createUserWithEmailAndPassword as jest.Mock;

describe('services/auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('login: mapea credenciales inválidas', async () => {
    mockedSignIn.mockRejectedValueOnce({ code: 'auth/invalid-credential' });

    await expect(Svc.login('a@a.com', 'x'))
      .rejects
      .toThrow('Credenciales inválidas');
  });

  it('login: otros errores → "No se pudo iniciar sesión"', async () => {
    mockedSignIn.mockRejectedValueOnce({ code: 'auth/network-request-failed' });

    await expect(Svc.login('a@a.com', 'x'))
      .rejects
      .toThrow('No se pudo iniciar sesión');
  });

  it('register: propaga código de Firebase (email ya en uso)', async () => {
    mockedCreate.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });

    await expect(Svc.register('existe@a.com', '123456'))
      .rejects
      .toMatchObject({ code: 'auth/email-already-in-use' });
  });

  it('register: éxito devuelve User (simulado)', async () => {
    const fakeUser = { uid: 'u1', getIdToken: jest.fn() };
    mockedCreate.mockResolvedValueOnce({ user: fakeUser });

    const u = await Svc.register('nuevo@a.com', '123456');
    expect(u).toBe(fakeUser);
  });
});
