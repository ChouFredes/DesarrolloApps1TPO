import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Nav = StackNavigationProp<AuthStackParamList, 'Welcome'>;

const W = {
  bg: '#0F1F35',
  surface: '#0A1626',
  card: '#0D1E33',
  input: '#152C44',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  inactive: 'rgba(225,225,225,0.3)',
  error: '#FF6B6B',
};

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslate = useRef(new Animated.Value(40)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(150, [
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(buttonsTranslate, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Logo area */}
        <Animated.View style={[styles.logoArea, { opacity: logoOpacity }]}>
          <Text style={styles.bienvenidos}>Bienvenidos a</Text>
          <View style={styles.logo}>
            <Image
              source={require('../../assets/pokeballs/rotom.png')}
              style={styles.rotomLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.vivo}>VIVO</Text>
              <Text style={styles.subastas}>SUBASTAS</Text>
            </View>
          </View>
        </Animated.View>

        {/* Botones */}
        <Animated.View style={[styles.buttons, { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslate }] }]}>
          <PrimaryButton title="Registrarse" onPress={() => navigation.navigate('RegisterStep1')} />
          <View style={{ height: spacing.md }} />
          <SecondaryButton title="Inicio de sesión" onPress={() => navigation.navigate('Login')} />
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: W.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-around',
  },
  logoArea: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  bienvenidos: {
    fontSize: 18,
    fontWeight: '500',
    color: W.textSub,
    letterSpacing: 0.5,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rotomLogo: {
    width: 64,
    height: 64,
  },
  vivo: {
    fontSize: 32,
    fontWeight: '800',
    color: W.accent,
    letterSpacing: 2,
  },
  subastas: {
    fontSize: 12,
    fontWeight: '600',
    color: W.textSub,
    letterSpacing: 4,
  },
  buttons: {
    paddingBottom: spacing.xl,
  },
});
