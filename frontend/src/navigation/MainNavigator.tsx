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
        tabBarStyle: {
          backgroundColor: '#0A1626',
          borderTopWidth: 0.5,
          borderTopColor: 'rgba(0,234,223,0.12)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#00EADF',
        tabBarInactiveTintColor: 'rgba(225,225,225,0.35)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
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
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // navigate al screen raíz ya popea el stack anidado hasta su base
            navigation.navigate('Home', { screen: 'HomeMain' });
          },
        })}
      />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsStackNavigator} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Notifications', { screen: 'NotificationsMain' });
          },
        })}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStackNavigator} 
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Profile', { screen: 'ProfileMain' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

export default MainNavigator;
