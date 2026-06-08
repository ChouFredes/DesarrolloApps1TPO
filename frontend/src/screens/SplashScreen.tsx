import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function SplashScreen() {
  const opacity = useRef(new Animated.Value(0.01)).current;
  const scale = useRef(new Animated.Value(0.82)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, { opacity, transform: [{ scale }] }]}>
        <MaterialCommunityIcons name="gavel" size={48} color="#00EADF" />
        <View style={styles.textGroup}>
          <Text style={styles.vivo}>VIVO</Text>
          <Text style={styles.subastas}>SUBASTAS</Text>
        </View>
      </Animated.View>
    </View>
  );
}

export default SplashScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1F35', justifyContent: 'center', alignItems: 'center' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textGroup: { flexDirection: 'column' },
  vivo: { fontSize: 32, fontWeight: '800', color: '#00EADF', lineHeight: 32 },
  subastas: { fontSize: 14, fontWeight: '600', color: 'rgba(225,225,225,0.5)', letterSpacing: 3 },
});
