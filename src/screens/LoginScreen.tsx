import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { login } from '../services/auth';
import { saveToken } from '../storage/secure';
import { auth } from '../services/firebase';

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState(''); const [password, setPassword] = useState('');

    const onLogin = async () => {
        try {
            await login(email, password);
            const idToken = await auth.currentUser?.getIdToken();
            if (idToken) await saveToken(idToken);
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    return (
        <View style={{ padding: 16, gap: 8 }}>
            <TextInput placeholder="Email" autoCapitalize="none" onChangeText={setEmail} value={email} />
            <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
            <Button title="Entrar" onPress={onLogin} />
            <Button title="Crear cuenta" onPress={() => navigation.navigate('Register')} />
        </View>
    );
}
