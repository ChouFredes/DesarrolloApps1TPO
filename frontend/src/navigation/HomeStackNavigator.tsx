import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CatalogoScreen } from '../screens/CatalogoScreen';
import { CatalogoDetailScreen } from '../screens/CatalogoDetailScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { AuctionRoomScreen } from '../screens/AuctionRoomScreen';
import { PostSubastaGanadorScreen } from '../screens/PostSubastaGanadorScreen';

export type HomeStackParamList = {
  HomeMain: undefined;
  Catalogo: { categoriaInicial?: string };
  CatalogoDetail: { subastaId: number };
  ItemDetail: { itemId: number; subastaId: number };
  AuctionRoom: { subastaId: number; itemId: number; itemName: string };
  PostSubastaGanador: { compraId: number };
};

const Stack = createStackNavigator<HomeStackParamList>();

export function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Catalogo" component={CatalogoScreen} />
      <Stack.Screen name="CatalogoDetail" component={CatalogoDetailScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="AuctionRoom" component={AuctionRoomScreen} />
      <Stack.Screen name="PostSubastaGanador" component={PostSubastaGanadorScreen} />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
