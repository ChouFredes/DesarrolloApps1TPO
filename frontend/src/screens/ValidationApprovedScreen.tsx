import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { useAuthStore } from '../stores/authStore';

type Route = RouteProp<AuthStackParamList, 'ValidationApproved'>;

function StepBar() {
  return (
    <View style={sb.container}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[sb.step, sb.active]} />
      ))}
    </View>
  );
}
const sb = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6, marginBottom: spacing.xl },
  step: { flex: 1, height: 4, borderRadius: 2 },
  active: { backgroundColor: colors.primary },
});

export function ValidationApprovedScreen() {
  const route = useRoute<Route>();
  const { categoria } = route.params;
  const { login, user } = useAuthStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <StepBar />
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={64} color={colors.success} style={{ alignSelf: 'center' }} />
          <Text style={styles.title}>Hemos validado sus datos</Text>
          <Text style={styles.label}>Su categoría es:</Text>
          <Text style={styles.categoria}>"{categoria}"</Text>
          <PrimaryButton title="Ir a subastas" onPress={() => {}} />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default ValidationApprovedScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl },
  content: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' },
  label: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  categoria: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
});
