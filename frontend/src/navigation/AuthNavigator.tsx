import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterStep1Screen } from '../screens/RegisterStep1Screen';
import { RegisterStep2Screen } from '../screens/RegisterStep2Screen';
import { RegisterVendedorScreen } from '../screens/RegisterVendedorScreen';
import { VendedorPendingScreen } from '../screens/VendedorPendingScreen';
import { ValidationPendingScreen } from '../screens/ValidationPendingScreen';
import { ValidationApprovedScreen } from '../screens/ValidationApprovedScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  RegisterStep1: undefined;
  RegisterStep2: { nombre: string };
  RegisterVendedor: undefined;
  VendedorPending: undefined;
  ValidationPending: undefined;
  ValidationApproved: { categoria: string };
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  const customInterpolator = ({ current }: any) => ({
    cardStyle: {
      opacity: current.progress,
    },
  });

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: customInterpolator,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterStep1" component={RegisterStep1Screen} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
      <Stack.Screen name="RegisterVendedor" component={RegisterVendedorScreen} />
      <Stack.Screen name="VendedorPending" component={VendedorPendingScreen} />
      <Stack.Screen name="ValidationPending" component={ValidationPendingScreen} />
      <Stack.Screen name="ValidationApproved" component={ValidationApprovedScreen} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
