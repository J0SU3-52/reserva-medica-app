import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { login } from '../services/auth';
import { saveToken } from '../storage/secure';
import { auth } from '../lib/firebase';
import { colors, radius, shadow } from '../theme';
import AppButton from '../components/ui/AppButton';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    try {
      setBusy(true);
      await login(email.trim(), password);
      const idToken = await auth.currentUser?.getIdToken(true);
      if (idToken) await saveToken(idToken);
      // RootNavigator cambiará al stack autenticado
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.container}>
        <View style={[styles.card, shadow]}>
          <Text style={styles.title}>Ingresa</Text>
          <Text style={styles.subtitle}>Usa tu correo y contraseña</Text>

          <TextInput
            placeholder="Correo"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Contraseña"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <AppButton title={busy ? 'Entrando…' : 'Entrar'} onPress={onLogin} disabled={busy} />
          <AppButton
            title="Crear cuenta"
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: 10 }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#fff',
  },
});
