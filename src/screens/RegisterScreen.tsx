// src/screens/RegisterScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { register } from '../services/auth';
import { saveToken } from '../storage/secure';
import AppButton from '../components/ui/AppButton';
import { colors, radius, shadow } from '../theme';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onRegister = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Completa los campos', 'Correo y contraseña son obligatorios.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setBusy(true);
      const user = await register(email.trim(), password); 
      const idToken = await user.getIdToken(true);
      if (idToken) await saveToken(idToken);
    } catch (e: any) {
      const msg =
        e?.code === 'auth/email-already-in-use' ? 'Ese correo ya está en uso.' :
        e?.code === 'auth/invalid-email'        ? 'Correo inválido.' :
        e?.code === 'auth/weak-password'        ? 'La contraseña es muy débil.' :
        e?.message || 'No se pudo crear la cuenta.';
      Alert.alert('Error', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={styles.container}>
        <View style={[styles.card, shadow]}>
          <Text style={styles.title}>Crea tu cuenta</Text>
          <Text style={styles.subtitle}>Regístrate con tu correo</Text>

          <TextInput
            style={styles.input}
            placeholder="Correo"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <AppButton
            title={busy ? 'Creando…' : 'Crear cuenta'}
            onPress={onRegister}
            disabled={busy}
          />
          <AppButton
            title="¿Ya tienes cuenta? Inicia sesión"
            variant="secondary"
            onPress={() => navigation.replace('Login')}
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
