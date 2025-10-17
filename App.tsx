import { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/helpers';
import { runMigrationsOnce } from './src/storage/migrations';
useEffect(() => { runMigrationsOnce(); }, []);
export default function App() {
    return (
        <NavigationContainer ref={navigationRef}>
            <RootNavigator />
        </NavigationContainer>
    );
}
