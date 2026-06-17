import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';
import { VendedorEsperaScreen } from '../screens/VendedorEsperaScreen';
import { VendedorHomeScreen } from '../screens/VendedorHomeScreen';
import { VendedorPerfilScreen } from '../screens/VendedorPerfilScreen';
import { MisArticulosScreen } from '../screens/MisArticulosScreen';
import { ArticuloDetailScreen } from '../screens/ArticuloDetailScreen';
import { EstadoArticuloScreen } from '../screens/EstadoArticuloScreen';
import { SolicitarArticuloScreen } from '../screens/SolicitarArticuloScreen';

export type VendedorItemsStackParamList = {
  MisArticulos: undefined;
  ArticuloDetalle: { articuloId: number };
  EstadoArticulo: { articuloId: number };
  SolicitarArticulo: undefined;
};

const ItemsStack = createStackNavigator<VendedorItemsStackParamList>();

function VendedorItemsStackNavigator() {
  const customInterpolator = ({ current }: any) => ({
    cardStyle: { opacity: current.progress },
  });
  return (
    <ItemsStack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: customInterpolator,
      }}
    >
      <ItemsStack.Screen name="MisArticulos" component={MisArticulosScreen} />
      <ItemsStack.Screen name="ArticuloDetalle" component={ArticuloDetailScreen} />
      <ItemsStack.Screen name="EstadoArticulo" component={EstadoArticuloScreen} />
      <ItemsStack.Screen name="SolicitarArticulo" component={SolicitarArticuloScreen} />
    </ItemsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

/**
 * Navegación del vendedor:
 * - Si todavía no fue verificado por el admin → pantalla de espera.
 * - Si fue aprobado → tabs Panel / Mis Ítems / Perfil.
 */
export function VendedorNavigator() {
  const { user } = useAuthStore();

  if (user?.admitido !== 'si') {
    return <VendedorEsperaScreen />;
  }

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
            PanelTab: { active: 'speedometer', inactive: 'speedometer-outline' },
            ItemsTab: { active: 'cube', inactive: 'cube-outline' },
            PerfilTab: { active: 'person', inactive: 'person-outline' },
          };
          const iconSet = icons[route.name];
          const iconName = iconSet ? (focused ? iconSet.active : iconSet.inactive) : 'ellipse-outline';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="PanelTab" component={VendedorHomeScreen} options={{ title: 'Panel' }} />
      <Tab.Screen name="ItemsTab" component={VendedorItemsStackNavigator} options={{ title: 'Mis Ítems' }} />
      <Tab.Screen name="PerfilTab" component={VendedorPerfilScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export default VendedorNavigator;
