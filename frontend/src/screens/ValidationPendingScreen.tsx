import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

function StepBar({ current }: { current: number }) {
  return (
    <View style={sb.container}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[sb.step, i <= current ? sb.active : sb.inactive]} />
      ))}
    </View>
  );
}
const sb = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6, marginBottom: spacing.xl },
  step: { flex: 1, height: 4, borderRadius: 2 },
  active: { backgroundColor: colors.primary },
  inactive: { backgroundColor: colors.border },
});

export function ValidationPendingScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <StepBar current={2} />
        <View style={styles.content}>
          <Ionicons name="time-outline" size={64} color={colors.textSecondary} style={{ alignSelf: 'center' }} />
          <Text style={styles.title}>Aún estamos validando sus datos...</Text>
          <Text style={styles.subtitle}>
            Le enviaremos un correo con novedades sobre su registro...
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ValidationPendingScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl },
  content: { flex: 1, justifyContent: 'center', gap: spacing.xl },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
