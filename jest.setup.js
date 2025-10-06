// jest.setup.js
require('whatwg-fetch');
require('@testing-library/jest-native/extend-expect');

// Expo solo expone variables que comienzan con EXPO_PUBLIC_.
process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY =
  process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || 'TEST_KEY';

// Mock del módulo local de Firebase (podemos reasignar auth.currentUser en tests)
jest.mock('./src/lib/firebase', () => {
  return { auth: { currentUser: null } };
});

// Mock de firebase/auth (lo usa http.secure y services/auth)
jest.mock('firebase/auth', () => {
  return {
    signOut: jest.fn().mockResolvedValue(undefined),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    onAuthStateChanged: jest.fn(),
  };
});

// Timers falsos si algún test los usa
jest.useFakeTimers();
