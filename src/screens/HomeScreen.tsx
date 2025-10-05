import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppButton from '../components/ui/AppButton';
import { logout } from '../services/auth';
import { clearToken } from '../storage/secure';
import WeatherCard from '../components/WeatherCard';
import { httpSecure } from '../services/http.secure';
import { colors, radius, shadow } from '../theme';

const SHOW_TEST_BUTTONS = (process.env.EXPO_PUBLIC_SHOW_TEST_BUTTONS === '1');

export default function HomeScreen({ navigation }: any) {
  const [showWeather, setShowWeather] = useState(false);
  const [busy, setBusy] = useState(false);

  const testAuthHeader = async () => {
    try {
      setBusy(true);
      const { data } = await httpSecure.get('https://httpbin.org/anything');
      const h = data?.headers?.Authorization || data?.headers?.authorization;
      alert(h?.startsWith('Bearer ') ? 'OK: llegó Authorization' : 'Falta header Authorization');
    } finally { setBusy(false); }
  };

  const test401 = async () => {
    try {
      setBusy(true);
      await httpSecure.get('https://httpbin.org/status/401');
    } catch { /* interceptor hará signOut */ }
    finally { setBusy(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bienvenido</Text>
      </View>

      <View style={styles.body}>
        <View style={[styles.card, shadow]}>

          {SHOW_TEST_BUTTONS && (
            <>
              <AppButton
                title={busy ? 'Probando…' : 'Probar envío de Authorization'}
                onPress={testAuthHeader}
                disabled={busy}
              />
              <AppButton
                title={busy ? 'Probando…' : 'Probar 401 (debe cerrar sesión)'}
                variant="danger"
                onPress={test401}
                disabled={busy}
              />
            </>
          )}

          <AppButton
            title={showWeather ? 'Ocultar clima' : 'Verificar clima'}
            variant="secondary"
            onPress={() => setShowWeather((p) => !p)}
          />
          {showWeather && <WeatherCard />}

          <AppButton title="Abrir mapa" onPress={() => navigation.navigate('Map')} />
          <AppButton title="Cerrar sesión" variant="danger" onPress={async () => {
            await logout();
            await clearToken();
          }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { flex: 1, padding: 16, alignItems: 'center', justifyContent: 'flex-start' },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '600', color: colors.text },
});
