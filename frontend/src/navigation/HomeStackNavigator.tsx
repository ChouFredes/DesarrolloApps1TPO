import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CatalogoScreen } from '../screens/CatalogoScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { AuctionRoomScreen } from '../screens/AuctionRoomScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  Catalogo: { categoriaInicial?: string };
  ItemDetail: { itemId: number; subastaId: number };
  AuctionRoom: { subastaId: number; itemId: number; itemName: string };
};

const Stack = createStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Catalogo" component={CatalogoScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="AuctionRoom" component={AuctionRoomScreen} />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
