import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { API_BASE_URL } from '../config/api';

type Nav = StackNavigationProp<AuthStackParamList, 'RegisterStep1'>;

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

export function RegisterStep1Screen() {
  const navigation = useNavigation<Nav>();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [pais, setPais] = useState('');
  const [dni, setDni] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!nombre || !apellido || !domicilio || !pais || !dni) { setError('Completá todos los campos'); return; }
    if (!accepted) { setError('Aceptá los términos y condiciones'); return; }
    setLoading(true); setError('');
    try {
      await axios.post(`${API_BASE_URL}/auth/registro/paso1`, { nombre, apellido, domicilio, pais, documento: dni });
      navigation.navigate('RegisterStep2', { nombre });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <StepBar current={0} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>¡Nos alegra conocerte!</Text>
          <Text style={styles.subtitle}>Registrate para poder ofertar</Text>
          <View style={{ height: spacing.xl }} />
          <InputField label="Ingresá tu nombre" value={nombre} onChangeText={setNombre} />
          <InputField label="Ingresá tu apellido" value={apellido} onChangeText={setApellido} />
          <InputField label="Domicilio" value={domicilio} onChangeText={setDomicilio} />
          <InputField label="País" value={pais} onChangeText={setPais} />
          <InputField label="DNI" value={dni} onChangeText={setDni} keyboardType="numeric" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="Registrate" onPress={handleRegister} loading={loading} />
          <TouchableOpacity style={styles.termsRow} onPress={() => setAccepted(!accepted)}>
            <View style={[styles.checkbox, accepted && styles.checked]}>
              {accepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              Al marcar esta opción, usted acepta los{' '}
              <Text style={styles.link}>términos</Text> y{' '}
              <Text style={styles.link}>condiciones</Text>.
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default RegisterStep1Screen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xl },
  back: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.xl },
  error: { color: colors.error, fontSize: 13, marginBottom: spacing.base },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.base, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2,
    borderColor: colors.accent, justifyContent: 'center', alignItems: 'center',
  },
  checked: { backgroundColor: colors.accent },
  termsText: { flex: 1, fontSize: 12, color: colors.text },
  link: { color: colors.accent },
});
