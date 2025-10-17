// App.tsx
import React, { useEffect } from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './src/navigation/helpers';
import { runMigrationsOnce } from './src/storage/migrations';

export default function App() {
  useEffect(() => { 
    runMigrationsOnce(); 
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}