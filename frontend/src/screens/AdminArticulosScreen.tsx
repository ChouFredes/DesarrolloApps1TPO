import React, { useCallback, useState, useEffect } from 'react';
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
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  KeyboardAvoidingView,
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
  descripcionCompleta?: string;
  fotosUrls?: string[];
}

// ─── Modal para revisar el item detalladamente ───────────────────────────────

function RevisarItemModal({
  visible,
  articulo: initialArticulo,
  token,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  articulo: ArticuloPendiente | null;
  token: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [articulo, setArticulo] = useState<ArticuloPendiente | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [precioPropuesto, setPrecioPropuesto] = useState('');
  const [comisionPropuesta, setComisionPropuesta] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Sincronizar el estado interno con el artículo seleccionado
  useEffect(() => {
    if (initialArticulo) {
      setArticulo(initialArticulo);
      setIsRejecting(false);
      setMotivoRechazo('');
      setPrecioPropuesto(initialArticulo.precioBase?.toString() || '');
      setComisionPropuesta(initialArticulo.comision?.toString() || '');
    } else {
      setArticulo(null);
    }
  }, [initialArticulo, visible]);

  if (!articulo) return null;

  const handleAceptarInspeccion = async () => {
    setActionLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/articulos/${articulo.id}/aceptar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✓ Inspección aceptada', 'El estado cambió a Aprobado. Ya podés proponer el precio base.');
      // Actualizar estado local del modal para que pase al formulario de propuesta inmediatamente
      setArticulo((prev) => (prev ? { ...prev, disponible: 'inspeccion_aprobada' } : null));
      onSuccess(); // Refrescar lista principal
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al aceptar la inspección.';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRechazarArticulo = async () => {
    if (!motivoRechazo.trim()) {
      Alert.alert('Error', 'El motivo de rechazo es obligatorio.');
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/articulos/${articulo.id}/rechazar`,
        { motivo: motivoRechazo.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Rechazado', 'El artículo fue rechazado.');
      onSuccess(); // Refrescar lista
      onClose();   // Cerrar modal
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al rechazar el artículo.';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnviarPropuesta = async () => {
    const p = parseFloat(precioPropuesto);
    const c = parseFloat(comisionPropuesta);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Error', 'Ingresá un precio base válido.');
      return;
    }
    if (isNaN(c) || c < 0) {
      Alert.alert('Error', 'Ingresá una comisión válida (puede ser 0).');
      return;
    }
    setActionLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/admin/articulos/${articulo.id}/precio-base`,
        { precioBase: p, comision: c },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✓ Propuesta enviada', 'El usuario recibirá la propuesta de precio.');
      onSuccess(); // Refrescar lista
      onClose();   // Cerrar modal
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al enviar la propuesta.';
      Alert.alert('Error', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const isPendiente = articulo.disponible === 'pendiente_inspeccion';
  const imagesToRender = articulo.fotosUrls && articulo.fotosUrls.length > 0
    ? articulo.fotosUrls
    : (articulo.imagenUrl ? [articulo.imagenUrl] : []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={modalStyles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={modalStyles.keyboardAvoiding}
          >
            <View style={modalStyles.sheet}>
              {/* Header */}
              <View style={modalStyles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.title}>Artículo #{articulo.id}</Text>
                  <Text style={modalStyles.categoryText}>{articulo.categoria ?? 'Sin categoría'}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={modalStyles.scroll}
                contentContainerStyle={modalStyles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Badge de Estado */}
                <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
                  {isPendiente ? (
                    <View style={[styles.estadoBadge, styles.badgePendiente]}>
                      <Ionicons name="time-outline" size={14} color="#D97706" />
                      <Text style={[styles.estadoBadgeText, styles.textPendiente]}>
                        Pendiente de inspección
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.estadoBadge, styles.badgeAprobado]}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                      <Text style={[styles.estadoBadgeText, styles.textAprobado]}>
                        Inspección aprobada
                      </Text>
                    </View>
                  )}
                </View>

                {/* Galería de fotos horizontal */}
                <Text style={modalStyles.sectionLabel}>Fotos del artículo ({imagesToRender.length})</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={modalStyles.galleryContainer}
                  style={modalStyles.galleryScroll}
                >
                  {imagesToRender.map((img, index) => (
                    <Image
                      key={index}
                      source={{ uri: img.startsWith('/') ? `${API_BASE_URL}${img}` : img }}
                      style={modalStyles.galleryImage}
                      resizeMode="cover"
                    />
                  ))}
                  {imagesToRender.length === 0 && (
                    <View style={modalStyles.galleryPlaceholder}>
                      <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
                      <Text style={modalStyles.galleryPlaceholderText}>Sin fotos disponibles</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Detalles de texto */}
                <Text style={modalStyles.sectionLabel}>Descripción Breve</Text>
                <Text style={modalStyles.descriptionText}>{articulo.descripcion}</Text>

                <Text style={modalStyles.sectionLabel}>Descripción Detallada</Text>
                <Text style={modalStyles.descriptionText}>
                  {articulo.descripcionCompleta || 'No se cargó una descripción detallada.'}
                </Text>

                <View style={modalStyles.divider} />

                {/* Panel de acciones */}
                {isPendiente ? (
                  <View style={modalStyles.actionsSection}>
                    {!isRejecting ? (
                      <View style={modalStyles.row}>
                        <TouchableOpacity
                          style={[modalStyles.actionBtn, modalStyles.approveBtn]}
                          onPress={handleAceptarInspeccion}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                              <Text style={modalStyles.approveBtnText}>Aceptar Inspección</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[modalStyles.actionBtn, modalStyles.rejectBtnBorder]}
                          onPress={() => setIsRejecting(true)}
                          disabled={actionLoading}
                        >
                          <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                          <Text style={modalStyles.rejectBtnText}>Rechazar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={modalStyles.rejectForm}>
                        <Text style={modalStyles.label}>Motivo del rechazo</Text>
                        <TextInput
                          style={[modalStyles.input, modalStyles.textArea]}
                          placeholder="Describa el motivo por el cual se rechaza el artículo..."
                          placeholderTextColor={colors.textSecondary}
                          value={motivoRechazo}
                          onChangeText={setMotivoRechazo}
                          multiline
                          numberOfLines={3}
                        />
                        <View style={modalStyles.row}>
                          <TouchableOpacity
                            style={[modalStyles.actionBtn, modalStyles.cancelRejectBtn]}
                            onPress={() => { setIsRejecting(false); setMotivoRechazo(''); }}
                            disabled={actionLoading}
                          >
                            <Text style={modalStyles.cancelRejectBtnText}>Volver</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[modalStyles.actionBtn, modalStyles.confirmRejectBtn]}
                            onPress={handleRechazarArticulo}
                            disabled={actionLoading}
                          >
                            {actionLoading ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <Text style={modalStyles.confirmRejectBtnText}>Rechazar Artículo</Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={modalStyles.proposalForm}>
                    <Text style={modalStyles.proposalTitle}>Proponer Precio Base y Comisión</Text>

                    <Text style={modalStyles.label}>Precio base ($)</Text>
                    <TextInput
                      style={modalStyles.input}
                      placeholder="Ej: 50000"
                      placeholderTextColor={colors.textSecondary}
                      value={precioPropuesto}
                      onChangeText={setPrecioPropuesto}
                      keyboardType="numeric"
                    />

                    <Text style={modalStyles.label}>Comisión ($)</Text>
                    <TextInput
                      style={modalStyles.input}
                      placeholder="Ej: 5000"
                      placeholderTextColor={colors.textSecondary}
                      value={comisionPropuesta}
                      onChangeText={setComisionPropuesta}
                      keyboardType="numeric"
                    />

                    <TouchableOpacity
                      style={[modalStyles.actionBtn, modalStyles.submitProposalBtn]}
                      onPress={handleEnviarPropuesta}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="send" size={14} color="#fff" />
                          <Text style={modalStyles.submitProposalBtnText}>Enviar Propuesta</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Artículo card ────────────────────────────────────────────────────────────

function ArticuloCard({
  articulo,
  onPress,
}: {
  articulo: ArticuloPendiente;
  onPress: () => void;
}) {
  const isPendiente = articulo.disponible === 'pendiente_inspeccion';
  const imageUrl = articulo.imagenUrl
    ? (articulo.imagenUrl.startsWith('/') ? `${API_BASE_URL}${articulo.imagenUrl}` : articulo.imagenUrl)
    : undefined;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons name="cube-outline" size={24} color={colors.textSecondary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {articulo.descripcion}
        </Text>
        <Text style={styles.cardMeta}>
          ID #{articulo.id} · {articulo.categoria ?? 'Sin categoría'}
        </Text>

        {/* Status Badge */}
        {isPendiente ? (
          <View style={[styles.estadoBadge, styles.badgePendiente]}>
            <Ionicons name="time-outline" size={12} color="#D97706" />
            <Text style={[styles.estadoBadgeText, styles.textPendiente]}>
              Pendiente de inspección
            </Text>
          </View>
        ) : (
          <View style={[styles.estadoBadge, styles.badgeAprobado]}>
            <Ionicons name="checkmark-circle-outline" size={12} color={colors.success} />
            <Text style={[styles.estadoBadgeText, styles.textAprobado]}>
              Inspección aprobada
            </Text>
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

// ─── Screen principal ─────────────────────────────────────────────────────────

export function AdminArticulosScreen() {
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [articulos, setArticulos] = useState<ArticuloPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Artículo seleccionado para revisar detalladamente
  const [selectedArticulo, setSelectedArticulo] = useState<ArticuloPendiente | null>(null);

  const fetchArticulos = useCallback(async () => {
    try {
      const res = await axios.get<ArticuloPendiente[]>(`${API_BASE_URL}/admin/articulos/pendientes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setArticulos(res.data);
      
      // Si el modal está abierto y se refresca, actualizar los datos del item abierto
      if (selectedArticulo) {
        const updated = res.data.find((a) => a.id === selectedArticulo.id);
        if (updated) {
          setSelectedArticulo(updated);
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || 'Error al cargar los artículos pendientes.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, [token, selectedArticulo]);

  useFocusEffect(
    useCallback(() => {
      fetchArticulos();
    }, [token])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchArticulos();
    setRefreshing(false);
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
              onPress={() => setSelectedArticulo(item)}
            />
          )}
        />
      )}

      {/* Modal Premium de Revisión y Propuestas */}
      <RevisarItemModal
        visible={selectedArticulo !== null}
        articulo={selectedArticulo}
        token={token}
        onClose={() => setSelectedArticulo(null)}
        onSuccess={fetchArticulos}
      />
    </SafeAreaView>
  );
}

export default AdminArticulosScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, gap: spacing.lg },
  emptyContainer: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },

  // Card styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  estadoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgePendiente: {
    backgroundColor: '#FEF3C7',
  },
  textPendiente: {
    color: '#D97706',
  },
  badgeAprobado: {
    backgroundColor: '#E8F5E9',
  },
  textAprobado: {
    color: colors.success,
  },
  estadoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  keyboardAvoiding: {
    width: '100%',
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.xl,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    maxHeight: '100%',
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  galleryScroll: {
    marginVertical: spacing.xs,
  },
  galleryContainer: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  galleryPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  galleryPlaceholderText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  actionsSection: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    backgroundColor: colors.success,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  rejectBtnBorder: {
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: 'transparent',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  rejectForm: {
    gap: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.base,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  cancelRejectBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelRejectBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmRejectBtn: {
    backgroundColor: colors.error,
  },
  confirmRejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  proposalForm: {
    gap: spacing.xs,
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  submitProposalBtn: {
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
  submitProposalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
