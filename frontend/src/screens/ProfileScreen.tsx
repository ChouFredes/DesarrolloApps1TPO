import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

// ponytail: paleta navy local (igual a la home) sobreescribe el theme cálido, sin tocar styles
const colors = {
  primary: '#00EADF', accent: '#00EADF', background: '#0F1F35', surface: '#0D1E33',
  text: '#E1E1E1', textSecondary: 'rgba(225,225,225,0.5)', border: 'rgba(0,234,223,0.2)',
  success: '#7ED957', error: '#FF6B6B',
};

type Nav = StackNavigationProp<ProfileStackParamList, 'ProfileMain'>;

interface UserData {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
}

function Avatar({ nombre, apellido, size = 80 }: { nombre: string; apellido: string; size?: number }) {
  const initials = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  return (
    <View
      style={[
        styles.avatarCircle,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.avatarInitials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
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
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { token, user, logout, setUser } = useAuthStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/usuarios/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setUserData(data);
        if (data && data.id) {
          setUser({
            id: data.id,
            nombre: data.nombre,
            apellido: data.apellido,
            categoria: data.categoria,
            admitido: data.admitido,
          });
        }
      })
      .catch(() => {
        // Fallback to store data
        if (user) {
          setUserData({
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id, token]);

  const displayData = userData ?? (user ? { id: user.id, nombre: user.nombre, apellido: user.apellido, email: '' } : null);

  const handleLogout = () => {
    Alert.alert('Salir', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerSide} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar + Name */}
          <View style={styles.avatarSection}>
            {displayData ? (
              <>
                <Avatar nombre={displayData.nombre} apellido={displayData.apellido} size={80} />
                <Text style={styles.userName}>
                  {displayData.nombre} {displayData.apellido}
                </Text>
                {displayData.email ? (
                  <Text style={styles.userEmail}>{displayData.email}</Text>
                ) : null}
              </>
            ) : (
              <Avatar nombre="U" apellido="?" size={80} />
            )}
          </View>

          {/* Menu */}
          <View style={styles.menuCard}>
            <MenuRow
              icon={<Ionicons name="person-outline" size={22} color={colors.accent} />}
              label="Información Personal"
              onPress={() => navigation.navigate('InformacionPersonal')}
            />
            <MenuRow
              icon={<MaterialCommunityIcons name="wallet-outline" size={22} color={colors.accent} />}
              label="Métodos de Pago"
              onPress={() => navigation.navigate('MetodosDePago')}
            />
            <MenuRow
              icon={<MaterialCommunityIcons name="package-variant-closed" size={22} color={colors.accent} />}
              label="Mis Artículos"
              onPress={() => navigation.navigate('MisArticulos')}
            />
            <MenuRow
              icon={<Ionicons name="receipt-outline" size={22} color={colors.accent} />}
              label="Mis Compras"
              onPress={() => navigation.navigate('Compras')}
            />
            <MenuRow
              icon={<Ionicons name="settings-outline" size={22} color={colors.accent} />}
              label="Configuración"
              onPress={() => navigation.navigate('Configuracion')}
              isLast
            />
          </View>

          {/* Salir button */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSide: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  avatarCircle: {
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: colors.surface,
    fontWeight: '700',
  },
  userName: {
    marginTop: spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
  menuCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  menuRowIcon: {
    width: 36,
    alignItems: 'center',
  },
  menuRowLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  logoutContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.base,
    backgroundColor: 'transparent',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
  },
});
