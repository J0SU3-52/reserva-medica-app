import { View, Text, Button } from 'react-native';
import { logout } from '../services/auth';
import { clearToken } from '../storage/secure';

export default function HomeScreen({ navigation }: any) {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text>Usuario autenticado ✅</Text>
            <Button title="Abrir mapa" onPress={() => navigation.navigate('Map')} />
            <Button title="Cerrar sesión" color="red" onPress={async () => { await logout(); await clearToken(); }} />
        </View>
    );
}
