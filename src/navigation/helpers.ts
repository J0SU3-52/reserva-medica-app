// src/navigation/helpers.ts
import { createNavigationContainerRef } from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

// Navegar genérico (si lo necesitas)
export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.navigate(name as never, params as never);
  }
}

// Usado por el interceptor cuando expira la sesión
export function navigateToLogin() {
  if (navigationRef.isReady()) {
    // @ts-ignore
    navigationRef.reset({
      index: 0,
      routes: [{ name: "Login" as never }],
    });
  }
}
