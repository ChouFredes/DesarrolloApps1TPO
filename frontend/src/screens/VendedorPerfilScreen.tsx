import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

interface MenuRowProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

function MenuRow({ icon, label, onPress, isLast }: MenuRowProps) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, !isLast && styles.menuRowBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuRowIcon}>{icon}</View>
      <Text style={styles.menuRowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={W.textSub} />
    </TouchableOpacity>
  );
}

export function VendedorPerfilScreen() {
  const navigation = useNavigation<any>();
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

        {/* Menu list */}
        <View style={styles.menuCard}>
          <MenuRow
            icon={<Ionicons name="person-outline" size={20} color={W.accent} />}
            label="Información Personal"
            onPress={() => navigation.navigate('InformacionPersonal')}
          />
          <MenuRow
            icon={<Ionicons name="card-outline" size={20} color={W.accent} />}
            label="Métodos de Pago"
            onPress={() => navigation.navigate('MetodosDePago')}
            isLast
          />
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
  menuCard: {
    backgroundColor: W.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: W.border,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,234,223,0.12)',
  },
  menuRowIcon: {
    width: 32,
    alignItems: 'center',
  },
  menuRowLabel: {
    flex: 1,
    fontSize: 15,
    color: W.text,
    marginLeft: spacing.xs,
  },
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
