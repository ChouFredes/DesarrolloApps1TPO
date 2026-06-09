import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { API_BASE_URL } from '../config/api';

type Nav = StackNavigationProp<AuthStackParamList, 'RegisterStep1'>;

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


export function RegisterStep1Screen() {
  const navigation = useNavigation<Nav>();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [pais, setPais] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cliente' | 'duenio'>('cliente');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getPaisId = (p: string): number => {
    const clean = p.trim().toLowerCase();
    if (clean.includes('japan') || clean.includes('japón') || clean.includes('japon')) return 2;
    if (clean.includes('spain') || clean.includes('españa') || clean.includes('espana')) return 3;
    if (clean.includes('brasil') || clean.includes('brazil')) return 4;
    if (clean.includes('francia') || clean.includes('france')) return 5;
    return 1; // Default to Argentina (1)
  };

  const handleRegister = async () => {
    if (!nombre || !apellido || !domicilio || !pais || !dni || !password) { setError('Completá todos los campos'); return; }
    if (!accepted) { setError('Aceptá los términos y condiciones'); return; }
    setLoading(true); setError('');
    try {
      const body = {
        nombre,
        apellido,
        direccion: domicilio,
        paisId: getPaisId(pais),
        documento: dni,
        fotoDniFrente: 'frente_placeholder',
        fotoDniDorso: 'dorso_placeholder',
        password,
        tipoUsuario: role,
      };
      await axios.post(`${API_BASE_URL}/auth/registro/paso1`, body);
      Alert.alert(
        'Registro exitoso',
        'Tu usuario fue creado correctamente. Ya podés iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.navigate('Welcome') }]
      );
    } catch (e: any) {
      setError(e.response?.data?.detalle || e.response?.data?.mensaje || e.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={W.text} />
          </TouchableOpacity>
          <Text style={styles.title}>¡Nos alegra conocerte!</Text>
          <Text style={styles.subtitle}>Registrate para poder ofertar</Text>
          <View style={{ height: spacing.xl }} />
          <InputField label="Ingresá tu nombre" value={nombre} onChangeText={setNombre} />
          <InputField label="Ingresá tu apellido" value={apellido} onChangeText={setApellido} />
          <InputField label="Domicilio" value={domicilio} onChangeText={setDomicilio} />
          <InputField label="País" value={pais} onChangeText={setPais} />
          <InputField label="DNI" value={dni} onChangeText={setDni} keyboardType="numeric" />
          
          <Text style={styles.label}>Quiero registrarme como:</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'cliente' && styles.roleBtnActive]}
              onPress={() => setRole('cliente')}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={18} color={role === 'cliente' ? '#0A1626' : W.text} />
              <Text style={[styles.roleBtnTxt, role === 'cliente' && styles.roleBtnTxtActive]}>Comprador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleBtn, role === 'duenio' && styles.roleBtnActive]}
              onPress={() => setRole('duenio')}
              activeOpacity={0.8}
            >
              <Ionicons name="briefcase-outline" size={18} color={role === 'duenio' ? '#0A1626' : W.text} />
              <Text style={[styles.roleBtnTxt, role === 'duenio' && styles.roleBtnTxtActive]}>Vendedor</Text>
            </TouchableOpacity>
          </View>

          <InputField label="Contraseña" value={password} onChangeText={setPassword} isPassword />
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
  safe: { flex: 1, backgroundColor: W.bg },
  container: { flexGrow: 1, padding: spacing.xl },
  back: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: W.text },
  subtitle: { fontSize: 14, color: W.textSub, marginTop: 4, marginBottom: spacing.xl },
  error: { color: W.error, fontSize: 13, marginBottom: spacing.base },
  label: {
    color: W.textSub,
    fontSize: 14,
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: W.input,
    borderWidth: 1,
    borderColor: W.border,
    borderRadius: 8,
    paddingVertical: 12,
  },
  roleBtnActive: {
    backgroundColor: W.accent,
    borderColor: W.accent,
  },
  roleBtnTxt: {
    color: W.text,
    fontSize: 14,
    fontWeight: '600',
  },
  roleBtnTxtActive: {
    color: '#0A1626',
  },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.base, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2,
    borderColor: '#00EADF', justifyContent: 'center', alignItems: 'center',
  },
  checked: { backgroundColor: '#00EADF' },
  termsText: { flex: 1, fontSize: 12, color: W.textSub },
  link: { color: '#00EADF' },
});
