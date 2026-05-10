import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Nav = StackNavigationProp<AuthStackParamList, 'RegisterStep2'>;

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

export function RegisterStep2Screen() {
  const navigation = useNavigation<Nav>();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <StepBar current={1} />
        <View style={styles.content}>
          <Text style={styles.title}>¡Gracias por registrarse!</Text>
          <Text style={styles.subtitle}>
            Validaremos sus datos y le enviaremos un correo para confirmar el registro.
          </Text>
          <PrimaryButton title="Estado de validación" onPress={() => navigation.navigate('ValidationPending')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default RegisterStep2Screen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl },
  content: { flex: 1, justifyContent: 'center', gap: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
