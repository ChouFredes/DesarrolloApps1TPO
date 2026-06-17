import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileScreen } from '../screens/ProfileScreen';
import { InformacionPersonalScreen } from '../screens/InformacionPersonalScreen';
import { MetodosDePagoScreen } from '../screens/MetodosDePagoScreen';
import { AgregarMedioPagoScreen } from '../screens/AgregarMedioPagoScreen';
import { ConfiguracionScreen } from '../screens/ConfiguracionScreen';
import { MisArticulosScreen } from '../screens/MisArticulosScreen';
import { ArticuloDetailScreen } from '../screens/ArticuloDetailScreen';
import { SolicitarArticuloScreen } from '../screens/SolicitarArticuloScreen';
import { ComprasScreen } from '../screens/ComprasScreen';
import { CompraDetalleScreen } from '../screens/CompraDetalleScreen';
import { MultasScreen } from '../screens/MultasScreen';
import { MetricasScreen } from '../screens/MetricasScreen';
import { EstadoArticuloScreen } from '../screens/EstadoArticuloScreen';
import { AdminUsuariosScreen } from '../screens/AdminUsuariosScreen';
import { AdminVendedoresScreen } from '../screens/AdminVendedoresScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  InformacionPersonal: undefined;
  MetodosDePago: undefined;
  AgregarMedioPago: undefined;
  Configuracion: undefined;
  MisArticulos: undefined;
  ArticuloDetalle: { articuloId: number };
  EstadoArticulo: { articuloId: number };
  SolicitarArticulo: undefined;
  Compras: undefined;
  CompraDetalle: { compraId: number };
  Multas: undefined;
  Metricas: undefined;
  AdminUsuarios: undefined;
  AdminVendedores: undefined;
};

const Stack = createStackNavigator<ProfileStackParamList>();

export function ProfileStackNavigator() {
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
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="InformacionPersonal" component={InformacionPersonalScreen} />
      <Stack.Screen name="MetodosDePago" component={MetodosDePagoScreen} />
      <Stack.Screen name="AgregarMedioPago" component={AgregarMedioPagoScreen} />
      <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
      <Stack.Screen name="MisArticulos" component={MisArticulosScreen} />
      <Stack.Screen name="ArticuloDetalle" component={ArticuloDetailScreen} />
      <Stack.Screen name="EstadoArticulo" component={EstadoArticuloScreen} />
      <Stack.Screen name="SolicitarArticulo" component={SolicitarArticuloScreen} />
      <Stack.Screen name="Compras" component={ComprasScreen} />
      <Stack.Screen name="CompraDetalle" component={CompraDetalleScreen} />
      <Stack.Screen name="Multas" component={MultasScreen} />
      <Stack.Screen name="Metricas" component={MetricasScreen} />
      <Stack.Screen name="AdminUsuarios" component={AdminUsuariosScreen} />
      <Stack.Screen name="AdminVendedores" component={AdminVendedoresScreen} />
    </Stack.Navigator>
  );
}

export default ProfileStackNavigator;
