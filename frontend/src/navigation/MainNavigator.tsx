import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { HomeStackNavigator } from './HomeStackNavigator';
import { SearchScreen } from '../screens/SearchScreen';
import { NotificationsStackNavigator } from './NotificationsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Home: focused ? 'home' : 'home-outline',
            Search: focused ? 'compass' : 'compass-outline',
            Notifications: focused ? 'notifications' : 'notifications-outline',
            Profile: focused ? 'person' : 'person-outline',
          };
          return <Ionicons name={icons[route.name] as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Notifications" component={NotificationsStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

export default MainNavigator;
