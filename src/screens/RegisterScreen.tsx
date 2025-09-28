import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { register } from '../services/auth';
import { saveToken } from '../storage/secure';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onRegister = async () => {
    try {
      const cred = await register(email.trim(), password);
      const idToken = await cred.user.getIdToken();
      if (idToken) await saveToken(idToken);

      // Si NO usas listenAuth en RootNavigator:
      navigation.replace('Home'); 
      // Si SÍ usas listenAuth, puedes omitir la línea de arriba.
    } catch (e: any) {
      const msg =
        e?.code === 'auth/email-already-in-use' ? 'Ese correo ya está en uso.'
      : e?.code === 'auth/invalid-email'        ? 'Correo inválido.'
      : e?.code === 'auth/weak-password'        ? 'La contraseña es muy débil.'
      : e?.message || 'Error al registrarse.';
      Alert.alert('Error', msg);
    }
  };

  return (
    <View style={{ padding: 16, gap: 8 }}>
      <TextInput placeholder="Email" autoCapitalize="none" onChangeText={setEmail} value={email} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
      <Button title="Crear cuenta" onPress={onRegister} />
    </View>
  );
}
