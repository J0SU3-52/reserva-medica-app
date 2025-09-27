import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { register } from '../services/auth';

export default function RegisterScreen({ navigation }: any) {
    const [email, setEmail] = useState(''); const [password, setPassword] = useState('');

    const onRegister = async () => {
        try { await register(email, password); navigation.replace('Home'); }
        catch (e: any) { Alert.alert('Error', e.message); }
    };

    return (
        <View style={{ padding: 16, gap: 8 }}>
            <TextInput placeholder="Email" autoCapitalize="none" onChangeText={setEmail} value={email} />
            <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
            <Button title="Crear cuenta" onPress={onRegister} />
        </View>
    );
}
