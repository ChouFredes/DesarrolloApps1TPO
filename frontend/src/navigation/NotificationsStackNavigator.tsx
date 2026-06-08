import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NotificationsScreen } from '../screens/NotificationsScreen';

export type NotificationsStackParamList = {
  NotificationsMain: undefined;
};

const Stack = createStackNavigator<NotificationsStackParamList>();

export function NotificationsStackNavigator() {
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
      <Stack.Screen name="NotificationsMain" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

export default NotificationsStackNavigator;
