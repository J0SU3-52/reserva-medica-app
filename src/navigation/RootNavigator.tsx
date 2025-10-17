import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { User } from 'firebase/auth';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import { listenAuth } from '../services/auth';

const AppStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <ActivityIndicator />
      <Text>Cargando…</Text>
    </View>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen name="Map" component={MapScreen} />
    </AppStack.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

export default function RootNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let settled = false;
    const unsub = listenAuth((u) => {
      console.log('[RootNavigator] auth changed →', !!u);
      setUser(u);
      if (!settled) { setReady(true); settled = true; }
    });
    const t = setTimeout(() => { if (!settled) { setReady(true); settled = true; } }, 2000);
    return () => { clearTimeout(t); unsub(); };
  }, []);

  if (!ready) return <Loading />;

  return (

    user ? <AppNavigator key="app" /> : <AuthNavigator key="auth" />
  );
}