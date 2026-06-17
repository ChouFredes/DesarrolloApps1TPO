import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

const CATEGORIES = ['comun', 'especial', 'plata', 'oro', 'platino'];

interface VendedorPendiente {
  id: number;
  nombre: string;
  apellido: string;
  documento: string;
  direccion?: string;
  pais?: string;
  fotoAcreditacionUrl?: string | null;
}

function VendedorCard({
  vendedor,
  onAprobar,
  onRechazar,
}: {
  vendedor: VendedorPendiente;
  onAprobar: (id: number, categoria: string) => Promise<void>;
  onRechazar: (id: number) => Promise<void>;
}) {
  const [categoria, setCategoria] = useState('comun');
  const [working, setWorking] = useState(false);

  const handleAprobar = async () => {
    setWorking(true);
    try {
      await onAprobar(vendedor.id, categoria);
    } finally {
      setWorking(false);
    }
  };

  const handleRechazar = () => {
    Alert.alert('Rechazar vendedor', `¿Rechazar el registro de ${vendedor.nombre} ${vendedor.apellido}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Rechazar',
        style: 'destructive',
        onPress: async () => {
          setWorking(true);
          try {
            await onRechazar(vendedor.id);
          } finally {
            setWorking(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>
            {vendedor.nombre} {vendedor.apellido}
          </Text>
          <Text style={styles.cardMeta}>DNI {vendedor.documento}</Text>
          {vendedor.pais ? <Text style={styles.cardMeta}>{vendedor.pais}</Text> : null}
        </View>
      </View>

      <Text style={styles.label}>Foto de acreditación</Text>
      {vendedor.fotoAcreditacionUrl ? (
        <Image
          source={{ uri: `${API_BASE_URL}${vendedor.fotoAcreditacionUrl}` }}
          style={styles.foto}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.fotoEmpty}>
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.fotoEmptyText}>Sin foto cargada</Text>
        </View>
      )}

      <Text style={styles.label}>Categoría a asignar</Text>
      <View style={styles.categoriesContainer}>
        {CATEGORIES.map((cat) => {
          const active = categoria === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, active && styles.categoryPillActive]}
              onPress={() => setCategoria(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={handleRechazar}
          disabled={working}
          activeOpacity={0.85}
        >
          <Text style={styles.rejectBtnText}>Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn, working && { opacity: 0.6 }]}
          onPress={handleAprobar}
          disabled={working}
          activeOpacity={0.85}
        >
          {working ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.approveBtnText}>Aprobar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function AdminVendedoresScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [vendedores, setVendedores] = useState<VendedorPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVendedores = useCallback(async () => {
    try {
      const res = await axios.get<VendedorPendiente[]>(`${API_BASE_URL}/admin/vendedores/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVendedores(res.data);
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || 'Error al cargar los vendedores pendientes.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchVendedores();
    }, [fetchVendedores])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVendedores();
    setRefreshing(false);
  };

  const aprobar = async (id: number, categoria: string) => {
    try {
      await axios.post(
        `${API_BASE_URL}/admin/vendedores/${id}/aprobar`,
        { categoria },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', 'Vendedor aprobado.');
      setVendedores((prev) => prev.filter((v) => v.id !== id));
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || 'Error al aprobar el vendedor.';
      Alert.alert('Error', msg);
    }
  };

  const rechazar = async (id: number) => {
    try {
      await axios.post(
        `${API_BASE_URL}/admin/vendedores/${id}/rechazar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setVendedores((prev) => prev.filter((v) => v.id !== id));
    } catch (error: any) {
      const msg = error?.response?.data?.mensaje || 'Error al rechazar el vendedor.';
      Alert.alert('Error', msg);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificación de Vendedores</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={vendedores}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay vendedores pendientes de verificación.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <VendedorCard vendedor={item} onAprobar={aprobar} onRechazar={rechazar} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

export default AdminVendedoresScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, gap: spacing.lg },
  emptyContainer: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', marginBottom: spacing.md },
  cardName: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  foto: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  fotoEmpty: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  fotoEmptyText: { fontSize: 12, color: colors.textSecondary },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  categoryPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  categoryPillTextActive: {
    color: colors.surface,
    fontWeight: '700',
  },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: { backgroundColor: colors.success },
  approveBtnText: { fontSize: 14, fontWeight: '700', color: colors.surface },
  rejectBtn: { borderWidth: 1, borderColor: colors.error },
  rejectBtnText: { fontSize: 14, fontWeight: '700', color: colors.error },
});
