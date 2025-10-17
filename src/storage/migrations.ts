import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureData, secrets } from "./secure-repo";

const MIGRATION_FLAG = "migr:toEncryptedStorage:v1";

export async function runMigrationsOnce() {
  const done = await AsyncStorage.getItem(MIGRATION_FLAG);
  if (done) return;

  // Ejemplos de claves antiguas
  const pairs: [string, "secret" | "data"][] = [
    ["access_token", "secret"],
    ["refresh_token", "secret"],
    ["user_profile", "data"],
    ["patient_cache", "data"],
  ];

  for (const [key, kind] of pairs) {
    const old = await AsyncStorage.getItem(key);
    if (!old) continue;

    try {
      if (kind === "secret") {
        await secrets.set(`session:${key}`, old);
      } else {
        const parsed = JSON.parse(old);
        await secureData.set(key, parsed);
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      // log redacted
      console.warn("migration error (redacted)", { key });
    }
  }

  await AsyncStorage.setItem(MIGRATION_FLAG, "1");
}
