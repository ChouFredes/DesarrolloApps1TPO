import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PrimaryButton } from '../components/PrimaryButton';
import { spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';

type Nav = StackNavigationProp<AuthStackParamList, 'VendedorPending'>;

const W = {
  bg: '#0F1F35',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
};

/**
 * Pantalla post-registro de vendedor: la cuenta queda pendiente
 * hasta que el admin verifique la foto de acreditación y asigne categoría.
 */
export function VendedorPendingScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="time-outline" size={56} color={W.accent} />
          </View>
          <Text style={styles.title}>Verificación en curso</Text>
          <Text style={styles.subtitle}>
            Recibimos tu registro. Un administrador va a revisar tu foto de
            acreditación y asignarte una categoría de vendedor.
          </Text>
          <Text style={styles.subtitle}>
            Cuando tu cuenta esté aprobada vas a poder iniciar sesión y cargar tus ítems.
          </Text>
        </View>
        <PrimaryButton title="Volver al inicio" onPress={() => navigation.navigate('Welcome')} />
      </View>
    </SafeAreaView>
  );
}

export default VendedorPendingScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  container: { flex: 1, padding: spacing.xl },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: W.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', color: W.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: W.textSub, textAlign: 'center', lineHeight: 22 },
});
