import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  TextInput,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

interface ArticuloPendiente {
  id: number;
  descripcion: string;
  disponible: string;
  estado: string;
  imagenUrl?: string;
  categoria?: string;
  precioBase?: number;
  comision?: number;
}

// ─── Modal para proponer precio ───────────────────────────────────────────────

function PropuestaModal({
  visible,
  articuloId,
  onClose,
  onSuccess,
  token,
}: {
  visible: boolean;
  articuloId: number | null;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}) {
  const [precio, setPrecio] = useState('');
  const [comision, setComision] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    const p = parseFloat(precio);
    const c = parseFloat(comision);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Error', 'Ingresá un precio base válido.');
      return;
    }
    if (isNaN(c) || c < 0) {
      Alert.alert('Error', 'Ingresá una comisión válida (puede ser 0).');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/articulos/${articuloId}/precio-base`,
        { precioBase: p, comision: c },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✓ Propuesta enviada', 'El usuario recibirá la propuesta y podrá aceptarla o rechazarla.');
      setPrecio('');
      setComision('');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al enviar la propuesta.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Proponer precio y comisión</Text>
          <Text style={modalStyles.subtitle}>Artículo #{articuloId}</Text>

          <Text style={modalStyles.label}>Precio base ($)</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="Ej: 50000"
            placeholderTextColor={colors.textSecondary}
            value={precio}
            onChangeText={setPrecio}
            keyboardType="numeric"
          />

          <Text style={modalStyles.label}>Comisión ($)</Text>
          <TextInput
            style={modalStyles.input}
            placeholder="Ej: 5000"
            placeholderTextColor={colors.textSecondary}
            value={comision}
            onChangeText={setComision}
            keyboardType="numeric"
          />

          <View style={modalStyles.actionsRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={modalStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.sendBtn} onPress={handleEnviar} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.sendText}>Enviar propuesta</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal para rechazar con motivo ──────────────────────────────────────────

function RechazoModal({
  visible,
  articuloId,
  onClose,
  onSuccess,
  token,
}: {
  visible: boolean;
  articuloId: number | null;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
}) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRechazar = async () => {
    if (!motivo.trim()) {
      Alert.alert('Error', 'El motivo de rechazo es obligatorio.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/articulos/${articuloId}/rechazar`,
        { motivo: motivo.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Rechazado', 'El artículo fue rechazado. El usuario verá el motivo.');
      setMotivo('');
      onSuccess();
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al rechazar el artículo.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>Rechazar artículo</Text>
          <Text style={modalStyles.subtitle}>El motivo será visible para el propietario.</Text>

          <Text style={modalStyles.label}>Motivo del rechazo</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            placeholder="Ej: El artículo no cumple con los requisitos de autenticidad..."
            placeholderTextColor={colors.textSecondary}
            value={motivo}
            onChangeText={setMotivo}
            multiline
            numberOfLines={4}
          />

          <View style={modalStyles.actionsRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose} disabled={loading}>
              <Text style={modalStyles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[modalStyles.sendBtn, { backgroundColor: '#EF4444' }]} onPress={handleRechazar} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={modalStyles.sendText}>Rechazar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Artículo card ────────────────────────────────────────────────────────────

function ArticuloCard({
  articulo,
  onAceptar,
  onRechazar,
  onProponer,
  working,
}: {
  articulo: ArticuloPendiente;
  onAceptar: (id: number) => void;
  onRechazar: (id: number) => void;
  onProponer: (id: number) => void;
  working: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="cube-outline" size={24} color={colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{articulo.descripcion}</Text>
          <Text style={styles.cardMeta}>ID #{articulo.id} · {articulo.categoria ?? 'Sin categoría'}</Text>
        </View>
      </View>

      {/* Estado badge */}
      <View style={styles.estadoBadge}>
        <Ionicons name="time-outline" size={14} color="#D97706" />
        <Text style={styles.estadoBadgeText}>Pendiente de inspección</Text>
      </View>

      <View style={styles.actionsCol}>
        {/* Paso 1: Aceptar la inspección física */}
        <Text style={styles.stepLabel}>1 — Inspección física</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn, working && { opacity: 0.6 }]}
            onPress={() => onAceptar(articulo.id)}
            disabled={working}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.approveBtnText}>Aceptar inspección</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => onRechazar(articulo.id)}
            disabled={working}
          >
            <Ionicons name="close-circle-outline" size={16} color={colors.error} />
            <Text style={styles.rejectBtnText}>Rechazar</Text>
          </TouchableOpacity>
        </View>

        {/* Paso 2: Proponer precio */}
        <Text style={styles.stepLabel}>2 — Proponer precio base y comisión</Text>
        <TouchableOpacity
          style={[styles.actionBtn, styles.propuestaBtn, working && { opacity: 0.6 }]}
          onPress={() => onProponer(articulo.id)}
          disabled={working}
        >
          <Ionicons name="document-text-outline" size={16} color="#7C3AED" />
          <Text style={styles.propuestaBtnText}>Enviar propuesta al usuario</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export function AdminArticulosScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [articulos, setArticulos] = useState<ArticuloPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modales
  const [propuestaModalId, setPropuestaModalId] = useState<number | null>(null);
  const [rechazoModalId, setRechazoModalId] = useState<number | null>(null);

  const fetchArticulos = useCallback(async () => {
    try {
      const res = await axios.get<ArticuloPendiente[]>(`${API_BASE_URL}/admin/articulos/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticulos(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al cargar los artículos pendientes.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => { fetchArticulos(); }, [fetchArticulos])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchArticulos();
    setRefreshing(false);
  };

  const handleAceptar = async (id: number) => {
    try {
      await axios.post(
        `${API_BASE_URL}/admin/articulos/${id}/aceptar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✓ Inspección aceptada', 'Ahora podés proponer el precio base al usuario.');
      await fetchArticulos();
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al aceptar el artículo.';
      Alert.alert('Error', msg);
    }
  };

  const removeArticulo = (id: number) => {
    setArticulos((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Artículos Pendientes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={articulos}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No hay artículos pendientes de inspección.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ArticuloCard
              articulo={item}
              onAceptar={handleAceptar}
              onRechazar={(id) => setRechazoModalId(id)}
              onProponer={(id) => setPropuestaModalId(id)}
              working={false}
            />
          )}
        />
      )}

      {/* Modales */}
      <PropuestaModal
        visible={propuestaModalId !== null}
        articuloId={propuestaModalId}
        token={token}
        onClose={() => setPropuestaModalId(null)}
        onSuccess={() => { setPropuestaModalId(null); fetchArticulos(); }}
      />
      <RechazoModal
        visible={rechazoModalId !== null}
        articuloId={rechazoModalId}
        token={token}
        onClose={() => setRechazoModalId(null)}
        onSuccess={() => { setRechazoModalId(null); fetchArticulos(); }}
      />
    </SafeAreaView>
  );
}

export default AdminArticulosScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.base,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, gap: spacing.lg },
  emptyContainer: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card, gap: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  estadoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  estadoBadgeText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  actionsCol: { gap: spacing.sm },
  stepLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, borderRadius: borderRadius.lg, paddingVertical: spacing.sm,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4,
  },
  approveBtn: { backgroundColor: colors.success },
  approveBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  rejectBtn: { borderWidth: 1.5, borderColor: colors.error, backgroundColor: 'transparent' },
  rejectBtnText: { fontSize: 13, fontWeight: '700', color: colors.error },
  propuestaBtn: {
    borderWidth: 1.5, borderColor: '#7C3AED', backgroundColor: '#F5F3FF',
    borderRadius: borderRadius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.base,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  propuestaBtnText: { fontSize: 13, fontWeight: '700', color: '#7C3AED' },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.xl, gap: spacing.md,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: -spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: 15, color: colors.text, backgroundColor: colors.background,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.xl,
    paddingVertical: spacing.base, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  sendBtn: {
    flex: 1, backgroundColor: colors.accent, borderRadius: borderRadius.xl,
    paddingVertical: spacing.base, alignItems: 'center',
  },
  sendText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
