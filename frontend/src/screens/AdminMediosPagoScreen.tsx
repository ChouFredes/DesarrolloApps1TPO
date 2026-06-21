import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

// ponytail: paleta navy local (igual a la home) sobreescribe el theme cálido, sin tocar styles
const colors = {
  primary: '#00EADF', accent: '#00EADF', background: '#0F1F35', surface: '#0D1E33',
  text: '#E1E1E1', textSecondary: 'rgba(225,225,225,0.5)', border: 'rgba(0,234,223,0.2)',
  success: '#7ED957', error: '#FF6B6B',
};

interface MedioPagoPendiente {
  id: number;
  tipo: string;
  descripcion?: string;
  moneda?: string;
  estado: string;
  esBancaExterior?: boolean;
  montoCheque?: number;
  // El backend debería incluir info del cliente — extendemos con lo disponible
  clienteNombre?: string;
  clienteDocumento?: string;
}

const TIPO_ICON: Record<string, string> = {
  CUENTA_BANCARIA: 'bank-outline',
  TARJETA_CREDITO: 'credit-card-outline',
  CHEQUE_CERTIFICADO: 'document-text-outline',
};

const TIPO_COLOR: Record<string, string> = {
  CUENTA_BANCARIA: '#2563EB',
  TARJETA_CREDITO: '#7C3AED',
  CHEQUE_CERTIFICADO: '#0891B2',
};

function MedioCard({
  medio,
  onVerificar,
  working,
}: {
  medio: MedioPagoPendiente;
  onVerificar: (id: number) => void;
  working: boolean;
}) {
  const iconName = (TIPO_ICON[medio.tipo] ?? 'wallet-outline') as any;
  const iconColor = TIPO_COLOR[medio.tipo] ?? colors.accent;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconCircle, { backgroundColor: iconColor + '22' }]}>
          <MaterialCommunityIcons name={iconName} size={22} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{medio.descripcion ?? medio.tipo}</Text>
          {medio.moneda && (
            <Text style={styles.cardMeta}>Moneda: {medio.moneda}</Text>
          )}
          {medio.esBancaExterior && (
            <Text style={styles.cardMeta}>🌐 Banca del exterior</Text>
          )}
          {medio.montoCheque != null && (
            <Text style={styles.cardMeta}>Monto: ${medio.montoCheque.toLocaleString('es-AR')}</Text>
          )}
          <Text style={styles.cardId}>Medio #{medio.id}</Text>
        </View>
        <View style={styles.pendienteBadge}>
          <Text style={styles.pendienteBadgeText}>PENDIENTE</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.verificarBtn, working && { opacity: 0.6 }]}
        onPress={() => onVerificar(medio.id)}
        disabled={working}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
        <Text style={styles.verificarBtnText}>Verificar medio de pago</Text>
      </TouchableOpacity>
    </View>
  );
}

export function AdminMediosPagoScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [medios, setMedios] = useState<MedioPagoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [working, setWorking] = useState(false);

  const fetchMedios = useCallback(async () => {
    try {
      const res = await axios.get<MedioPagoPendiente[]>(`${API_BASE_URL}/admin/mediosPago/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMedios(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al cargar los medios de pago pendientes.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => { fetchMedios(); }, [fetchMedios])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMedios();
    setRefreshing(false);
  };

  const handleVerificar = async (id: number) => {
    Alert.alert(
      'Verificar medio de pago',
      '¿Confirmás que este medio de pago fue validado y el usuario puede pujar con él?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Verificar',
          onPress: async () => {
            setWorking(true);
            try {
              await axios.post(
                `${API_BASE_URL}/admin/mediosPago/${id}/verificar`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              setMedios((prev) => prev.filter((m) => m.id !== id));
              Alert.alert('✓ Verificado', 'El medio de pago fue aprobado. El usuario ya puede pujar.');
            } catch (err: any) {
              const msg = err?.response?.data?.mensaje || 'Error al verificar.';
              Alert.alert('Error', msg);
            } finally {
              setWorking(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medios de Pago Pendientes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Nota informativa */}
      <View style={styles.infoBar}>
        <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
        <Text style={styles.infoBarText}>
          Los medios de pago verificados permiten al usuario pujar en subastas.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={medios}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay medios de pago pendientes de verificación.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <MedioCard
              medio={item}
              onVerificar={handleVerificar}
              working={working}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

export default AdminMediosPagoScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  infoBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#EFF6FF', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#BFDBFE',
  },
  infoBarText: { flex: 1, fontSize: 12, color: '#1D4ED8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, gap: spacing.lg },
  emptyContainer: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    ...shadows.card, gap: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardId: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  pendienteBadge: {
    backgroundColor: '#FEF3C7', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  pendienteBadgeText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  verificarBtn: {
    backgroundColor: colors.success, borderRadius: borderRadius.xl,
    paddingVertical: spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  verificarBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
