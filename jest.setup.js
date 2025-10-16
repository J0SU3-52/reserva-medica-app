import "@testing-library/jest-native/extend-expect";

// Silenciar warnings ruidosos de RN (opcional):
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("useNativeDriver")) return;
  originalError(...args);
};
