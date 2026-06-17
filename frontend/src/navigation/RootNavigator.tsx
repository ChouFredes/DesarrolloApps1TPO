import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../stores/authStore';
import { SplashScreen } from '../screens/SplashScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { VendedorNavigator } from './VendedorNavigator';

const Stack = createStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, user } = useAuthStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          cardStyleInterpolator: ({ current }: any) => ({
            cardStyle: {
              opacity: current.progress,
            },
          }),
        }}
      >
        {showSplash ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : isAuthenticated ? (
          user?.categoria === 'vendedor' ? (
            <Stack.Screen name="Vendedor" component={VendedorNavigator} />
          ) : (
            <Stack.Screen name="Main" component={MainNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default RootNavigator;
