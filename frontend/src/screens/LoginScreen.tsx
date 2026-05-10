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
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

type Nav = StackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuthStore();
  const [documento, setDocumento] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!documento || !password) { setError('Completá todos los campos'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { documento, password });
      const { accessToken, refreshToken, usuarioId, nombre, apellido, categoria } = res.data;
      login(accessToken, refreshToken, { id: usuarioId, nombre, apellido, categoria });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Iniciar sesión</Text>
          <InputField label="Documento" value={documento} onChangeText={setDocumento} keyboardType="numeric" />
          <InputField label="Contraseña" value={password} onChangeText={setPassword} isPassword />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="Iniciar sesión" onPress={handleLogin} loading={loading} style={styles.btn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, padding: spacing.xl },
  back: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: spacing.xxl },
  error: { color: colors.error, fontSize: 13, marginBottom: spacing.base },
  btn: { marginTop: spacing.base },
});
