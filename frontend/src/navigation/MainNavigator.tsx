import React, { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackNavigator } from './HomeStackNavigator';
import { SearchScreen } from '../screens/SearchScreen';
import { NotificationsStackNavigator } from './NotificationsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  focused: boolean;
  color: string;
  size: number;
  iconName: string;
}

function TabIcon({ focused, color, size, iconName }: TabIconProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (focused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.18,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.0,
          duration: 100,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [focused]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons name={iconName as any} size={size} color={color} />
    </Animated.View>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#EDE8E1',
          borderTopColor: '#DDD5CA',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#F5A623',
        tabBarInactiveTintColor: '#8C7B6B',
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Home: { active: 'home', inactive: 'home-outline' },
            Search: { active: 'compass', inactive: 'compass-outline' },
            Notifications: { active: 'notifications', inactive: 'notifications-outline' },
            Profile: { active: 'person', inactive: 'person-outline' },
          };
          const iconSet = icons[route.name];
          const iconName = iconSet ? (focused ? iconSet.active : iconSet.inactive) : 'ellipse-outline';
          return <TabIcon focused={focused} color={color} size={size} iconName={iconName} />;
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
