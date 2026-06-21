import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { API_BASE_URL } from '../config/api';

type Nav = StackNavigationProp<AuthStackParamList, 'RegisterPassword'>;
type Route = RouteProp<AuthStackParamList, 'RegisterPassword'>;

const W = {
  bg: '#0F1F35',
  surface: '#0A1626',
  card: '#0D1E33',
  input: '#152C44',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  error: '#FF6B6B',
};

export function RegisterPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { nombre, apellido, domicilio, pais, dni } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    if (!password || !confirmPassword) {
      setError('Completá ambos campos de contraseña');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    setError('');

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
        tipoUsuario: 'cliente',
      };
      await axios.post(`${API_BASE_URL}/auth/registro/paso1`, body);
      Alert.alert(
        '¡Solicitud enviada!',
        'Tu solicitud de registro fue recibida. La empresa verificará tus datos y recibirás un correo para completar el registro una vez aprobado.',
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
          <Text style={styles.title}>Crea tu contraseña</Text>
          <Text style={styles.subtitle}>Escribí y confirmá la contraseña para tu nueva cuenta</Text>
          <View style={{ height: spacing.xl }} />
          
          <InputField 
            label="Contraseña" 
            value={password} 
            onChangeText={setPassword} 
            isPassword 
          />
          <InputField 
            label="Repetir contraseña" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            isPassword 
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          
          <PrimaryButton title="Finalizar Registro" onPress={handleRegister} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default RegisterPasswordScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  container: { flexGrow: 1, padding: spacing.xl },
  back: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: W.text },
  subtitle: { fontSize: 14, color: W.textSub, marginTop: 4, marginBottom: spacing.xl },
  error: { color: W.error, fontSize: 13, marginBottom: spacing.base },
});
