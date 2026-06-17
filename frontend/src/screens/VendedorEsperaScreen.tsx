import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { spacing } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

const W = {
  bg: '#0F1F35',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  error: '#FF6B6B',
};

/**
 * Pantalla que ve el vendedor logueado mientras su cuenta
 * está pendiente de verificación (o si fue rechazada).
 */
export function VendedorEsperaScreen() {
  const { token, user, setUser, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const rechazado = user?.admitido === 'rechazado';

  const actualizarEstado = async () => {
    if (!user) return;
    setRefreshing(true);
    setMensaje('');
    try {
      const res = await axios.get(`${API_BASE_URL}/vendedores/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { admitido, categoria } = res.data;
      setUser({ ...user, admitido, nivel: categoria });
      if (admitido !== 'si') {
        setMensaje(
          admitido === 'rechazado'
            ? 'Tu registro fue rechazado por el administrador.'
            : 'Todavía estamos verificando tu cuenta. Probá de nuevo más tarde.'
        );
      }
    } catch {
      setMensaje('No pudimos consultar el estado. Intentá de nuevo.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.iconCircle, rechazado && { borderColor: 'rgba(255,107,107,0.4)' }]}>
            <Ionicons
              name={rechazado ? 'close-circle-outline' : 'hourglass-outline'}
              size={56}
              color={rechazado ? W.error : W.accent}
            />
          </View>
          <Text style={styles.title}>
            {rechazado ? 'Registro rechazado' : 'Tu cuenta está en revisión'}
          </Text>
          <Text style={styles.subtitle}>
            {rechazado
              ? 'El administrador rechazó tu solicitud de vendedor. Contactate con soporte si creés que es un error.'
              : 'Un administrador está verificando tu foto de acreditación para asignarte una categoría. Cuando esté lista vas a poder cargar tus ítems.'}
          </Text>
          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
        </View>
        {!rechazado && (
          <PrimaryButton title="Actualizar estado" onPress={actualizarEstado} loading={refreshing} />
        )}
        <View style={{ height: spacing.md }} />
        <SecondaryButton title="Cerrar sesión" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}

export default VendedorEsperaScreen;

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
  mensaje: { fontSize: 13, color: W.accent, textAlign: 'center' },
});
