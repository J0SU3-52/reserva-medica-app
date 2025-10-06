process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY =
  process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || 'TEST_KEY';

// jest.polyfills.js
// Se ejecuta ANTES de los tests (definido en jest.setupFiles)

// 1) Flag de React Native/Expo
global.__DEV__ = true;

// 2) fetch / Request / Response / Headers
// whatwg-fetch rompe menos que el setup de RN en Jest.
require('whatwg-fetch');

// 3) TextEncoder / TextDecoder (algunas libs los requieren)
const { TextEncoder, TextDecoder } = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// 4) setImmediate / clearImmediate (no existen en Node en algunos entornos)
if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}
if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => clearTimeout(id);
}

// 5) (Opcional) Asegurar timers reales por defecto.
// Tus tests pueden cambiar a fake timers cuando lo necesiten.
if (typeof jest !== 'undefined' && jest.useRealTimers) {
  jest.useRealTimers();
}
