import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { spacing } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { NIVEL_COLORS } from './VendedorHomeScreen';

const W = {
  bg: '#0F1F35',
  card: '#0D1E33',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
};

interface Perfil {
  id: number;
  nombre: string;
  apellido: string;
  admitido: string;
  categoria: string | null;
  fotoAcreditacionUrl: string | null;
}

export function VendedorPerfilScreen() {
  const { token, user, logout } = useAuthStore();
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  useEffect(() => {
    axios
      .get<Perfil>(`${API_BASE_URL}/vendedores/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setPerfil(res.data))
      .catch(() => {});
  }, [token]);

  const nombre = perfil?.nombre ?? user?.nombre ?? '';
  const apellido = perfil?.apellido ?? user?.apellido ?? '';
  const nivel = perfil?.categoria ?? user?.nivel ?? 'comun';
  const nivelColor = NIVEL_COLORS[nivel] ?? W.accent;
  const initials = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

  const handleLogout = () => {
    Alert.alert('Salir', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>Perfil de vendedor</Text>

        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { borderColor: nivelColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>
            {nombre} {apellido}
          </Text>
          <View style={[styles.nivelBadge, { borderColor: nivelColor }]}>
            <Ionicons name="medal-outline" size={14} color={nivelColor} />
            <Text style={[styles.nivelText, { color: nivelColor }]}>{nivel.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Foto de acreditación</Text>
        <View style={styles.fotoCard}>
          {perfil?.fotoAcreditacionUrl ? (
            <Image
              source={{ uri: `${API_BASE_URL}${perfil.fotoAcreditacionUrl}` }}
              style={styles.foto}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.fotoEmpty}>
              <Ionicons name="image-outline" size={28} color={W.textSub} />
              <Text style={styles.fotoEmptyText}>Sin foto cargada</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={W.accent} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

export default VendedorPerfilScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  container: { padding: spacing.xl },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: W.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  avatarSection: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    backgroundColor: W.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: W.text },
  userName: { fontSize: 18, fontWeight: '700', color: W.text },
  nivelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  nivelText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: W.text, marginBottom: spacing.sm },
  fotoCard: {
    borderWidth: 1,
    borderColor: W.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: W.card,
    marginBottom: spacing.xl,
  },
  foto: { width: '100%', height: 200 },
  fotoEmpty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: 6 },
  fotoEmptyText: { fontSize: 13, color: W.textSub },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: W.border,
    borderRadius: 14,
    paddingVertical: spacing.base,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: W.accent },
});
