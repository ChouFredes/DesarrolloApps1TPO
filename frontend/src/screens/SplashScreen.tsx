import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <MaterialCommunityIcons name="gavel" size={48} color={colors.primary} />
        <View style={styles.textGroup}>
          <Text style={styles.vivo}>VIVO</Text>
          <Text style={styles.subastas}>SUBASTAS</Text>
        </View>
      </View>
    </View>
  );
}

export default SplashScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  logo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textGroup: { flexDirection: 'column' },
  vivo: { fontSize: 32, fontWeight: '800', color: colors.primary, lineHeight: 32 },
  subastas: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, letterSpacing: 3 },
});
