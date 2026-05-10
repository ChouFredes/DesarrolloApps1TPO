import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NotificationsScreen } from '../screens/NotificationsScreen';

export type NotificationsStackParamList = {
  NotificationsMain: undefined;
};

const Stack = createStackNavigator<NotificationsStackParamList>();

export function NotificationsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsMain" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export default NotificationsStackNavigator;
