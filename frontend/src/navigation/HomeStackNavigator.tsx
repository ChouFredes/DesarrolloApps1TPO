import React from 'react';
import { Easing, Dimensions } from 'react-native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CatalogoScreen } from '../screens/CatalogoScreen';
import { CatalogoDetailScreen } from '../screens/CatalogoDetailScreen';
import { ItemDetailScreen } from '../screens/ItemDetailScreen';
import { AuctionRoomScreen } from '../screens/AuctionRoomScreen';
import { PostSubastaGanadorScreen } from '../screens/PostSubastaGanadorScreen';

const { width: deviceWidth, height: deviceHeight } = Dimensions.get('window');

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
        cardOverlayEnabled: true,
      }}
    >
      {/* Transición 1: HomeMain — sin transición custom, es la pantalla raíz */}
      <Stack.Screen name="HomeMain" component={HomeScreen} />

      {/* Transición 2: Catalogo — slide horizontal estándar de React Navigation */}
      <Stack.Screen name="Catalogo" component={CatalogoScreen} />

      {/* Transición 3: CatalogoDetail — fade + slide-up desde 40px */}
      <Stack.Screen
        name="CatalogoDetail"
        component={CatalogoDetailScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 320, easing: Easing.out(Easing.cubic) } },
            close: { animation: 'timing', config: { duration: 260, easing: Easing.in(Easing.quad) } },
          },
          cardStyleInterpolator: ({ current, next, layouts }) => ({
            cardStyle: {
              opacity: current.progress,
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          }),
        }}
      />

      {/* Transición 4: ItemDetail — slide horizontal con spring, pantalla saliente -25% */}
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          transitionSpec: {
            open: { animation: 'spring', config: { stiffness: 280, damping: 28, mass: 1, overshootClamping: true } },
            close: { animation: 'spring', config: { stiffness: 300, damping: 35, mass: 1, overshootClamping: true } },
          },
          cardStyleInterpolator: ({ current, next, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.15],
              }),
            },
            // Pantalla saliente (CatalogoDetail) se desplaza -25%
            ...(next
              ? {
                  containerStyle: {
                    transform: [
                      {
                        translateX: next.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -layouts.screen.width * 0.25],
                        }),
                      },
                    ],
                  },
                }
              : {}),
          }),
        }}
      />

      {/* Transición 5: AuctionRoom — slide-up dramático desde 60% inferior + escala pantalla saliente */}
      <Stack.Screen
        name="AuctionRoom"
        component={AuctionRoomScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'vertical',
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 420, easing: Easing.out(Easing.cubic) } },
            close: { animation: 'timing', config: { duration: 340, easing: Easing.inOut(Easing.ease) } },
          },
          cardStyleInterpolator: ({ current, next, layouts }) => ({
            cardStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.4, 1],
              }),
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.height * 0.6, 0],
                  }),
                },
                {
                  scale: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.97, 1],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.6],
              }),
            },
            // Pantalla saliente (ItemDetail) hace scale hacia atrás y se oscurece
            ...(next
              ? {
                  containerStyle: {
                    opacity: next.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.6],
                    }),
                    transform: [
                      {
                        scale: next.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.93],
                        }),
                      },
                    ],
                  },
                }
              : {}),
          }),
        }}
      />

      {/* Transición 6: PostSubastaGanador — mismo estilo que CatalogoDetail (fade + slide-up, 320ms) */}
      <Stack.Screen
        name="PostSubastaGanador"
        component={PostSubastaGanadorScreen}
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 320, easing: Easing.out(Easing.cubic) } },
            close: { animation: 'timing', config: { duration: 260, easing: Easing.in(Easing.quad) } },
          },
          cardStyleInterpolator: ({ current, next, layouts }) => ({
            cardStyle: {
              opacity: current.progress,
              transform: [
                {
                  translateY: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
            overlayStyle: {
              opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.3],
              }),
            },
          }),
        }}
      />
    </Stack.Navigator>
  );
}

export default HomeStackNavigator;
