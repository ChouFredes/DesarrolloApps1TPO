import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import axios from 'axios';
import { spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { CATEGORIA_LABELS } from './VendedorHomeScreen';

const W = {
  bg: '#0F1F35',
  card: '#0D1E33',
  surface: '#0A1626',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  error: '#FF6B6B',
  success: '#7ED957',
  inputBg: '#152C44',
};

interface Item {
  id: number;
  descripcion: string;
  disponible: string;
  estado: string;
  motivoRechazo?: string | null;
  precioBase?: number | null;
  comision?: number | null;
  polizaNro?: string | null;
  imagenUrl?: string | null;
  categoria?: string | null;
  descripcionCompleta?: string | null;
  fotosUrls?: string[];
}

interface Lote {
  id: number;
  titulo: string;
  fotoPortadaUrl?: string | null;
  estado: string;
  categoria?: string | null;
  duenioNombre?: string | null;
  items: Item[];
}

function estadoItem(disponible: string): { label: string; color: string } {
  switch (disponible) {
    case 'pendiente_inspeccion':
      return { label: 'Pendiente de inspección', color: '#FFB454' };
    case 'inspeccion_aprobada':
      return { label: 'Inspección aprobada — proponer precio', color: '#7ED957' };
    case 'propuesta_enviada':
      return { label: 'Propuesta enviada', color: '#B794F6' };
    case 'aceptado_por_usuario':
      return { label: 'Aceptada — gestionar seguro', color: '#7ED957' };
    case 'incluido_en_subasta':
      return { label: 'Publicado', color: '#00EADF' };
    case 'rechazado':
      return { label: 'Rechazado', color: '#FF6B6B' };
    case 'rechazado_por_usuario':
      return { label: 'Propuesta rechazada', color: '#FF6B6B' };
    case 'vendido':
      return { label: 'Vendido', color: '#00EADF' };
    default:
      return { label: disponible, color: '#9BA8B5' };
  }
}

// ─── Modal de revisión por ítem ──────────────────────────────────────────────
function RevisarItemModal({
  item,
  token,
  onClose,
  onDone,
}: {
  item: Item | null;
  token: string | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [precio, setPrecio] = useState('');
  const [pct, setPct] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRechazando(false);
    setMotivo('');
    setPrecio(item?.precioBase != null ? String(item.precioBase) : '');
    setPct(10);
  }, [item]);

  if (!item) return null;

  const isPendiente = item.disponible === 'pendiente_inspeccion';
  const isAprobada = item.disponible === 'inspeccion_aprobada';
  const isAceptado = item.disponible === 'aceptado_por_usuario';
  const fotos = item.fotosUrls && item.fotosUrls.length > 0
    ? item.fotosUrls
    : (item.imagenUrl ? [item.imagenUrl] : []);

  const aceptarInspeccion = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/articulos/${item.id}/aceptar`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo aceptar la inspección.');
    } finally {
      setLoading(false);
    }
  };

  const rechazar = async () => {
    if (!motivo.trim()) {
      Alert.alert('Falta el motivo', 'Ingresá el motivo del rechazo.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/articulos/${item.id}/rechazar`, { motivo: motivo.trim() }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo rechazar el ítem.');
    } finally {
      setLoading(false);
    }
  };

  const proponerPrecio = async () => {
    const p = parseFloat(precio);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Precio inválido', 'Ingresá un precio base válido.');
      return;
    }
    const c = Math.round((p * pct) / 100);
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/articulos/${item.id}/precio-base`, { precioBase: p, comision: c }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo enviar la propuesta.');
    } finally {
      setLoading(false);
    }
  };

  const post = async (path: string, okMsg: string) => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/articulos/${item.id}/${path}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Listo', okMsg);
      onDone();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo completar la acción.');
    } finally {
      setLoading(false);
    }
  };

  const est = estadoItem(item.disponible);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <RNSafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={W.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Ítem #{item.id}</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={[styles.badge, { borderColor: est.color, marginBottom: spacing.md }]}>
              <Text style={[styles.badgeText, { color: est.color }]}>{est.label}</Text>
            </View>

            <Text style={styles.sectionLabel}>Fotos ({fotos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotosRow}>
              {fotos.length > 0 ? (
                fotos.map((u, i) => (
                  <Image
                    key={i}
                    source={{ uri: u.startsWith('/') ? `${API_BASE_URL}${u}` : u }}
                    style={styles.foto}
                    resizeMode="cover"
                  />
                ))
              ) : (
                <View style={styles.fotoPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={W.textSub} />
                </View>
              )}
            </ScrollView>

            <Text style={styles.sectionLabel}>Descripción</Text>
            <Text style={styles.bodyText}>{item.descripcion}</Text>

            <Text style={styles.sectionLabel}>Descripción detallada</Text>
            <Text style={styles.bodyText}>{item.descripcionCompleta || 'Sin descripción detallada.'}</Text>

            {item.categoria ? (
              <>
                <Text style={styles.sectionLabel}>Categoría</Text>
                <Text style={styles.bodyText}>{CATEGORIA_LABELS[item.categoria] ?? item.categoria}</Text>
              </>
            ) : null}

            <View style={styles.divider} />

            {/* Acciones según estado */}
            {isPendiente && !rechazando ? (
              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={aceptarInspeccion} disabled={loading}>
                  {loading ? <ActivityIndicator color={W.surface} /> : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={16} color={W.surface} />
                      <Text style={styles.approveText}>Aceptar inspección</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => setRechazando(true)} disabled={loading}>
                  <Ionicons name="close-circle-outline" size={16} color={W.error} />
                  <Text style={styles.rejectText}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {isPendiente && rechazando ? (
              <View>
                <Text style={styles.label}>Motivo del rechazo</Text>
                <View style={[styles.inputWrap, styles.inputWrapMulti]}>
                  <TextInput
                    style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                    placeholder="Describí por qué se rechaza..."
                    placeholderTextColor={W.textSub}
                    value={motivo}
                    onChangeText={setMotivo}
                    multiline
                  />
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.ghostBtn]} onPress={() => setRechazando(false)} disabled={loading}>
                    <Text style={styles.ghostText}>Volver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.confirmRejectBtn]} onPress={rechazar} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmRejectText}>Rechazar ítem</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {isAprobada ? (
              <View>
                <Text style={styles.formTitle}>Proponer precio base y comisión</Text>
                <Text style={styles.label}>Precio base ($)</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 50000"
                    placeholderTextColor={W.textSub}
                    value={precio}
                    onChangeText={setPrecio}
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.label}>Comisión de la empresa</Text>
                <View style={styles.pctRow}>
                  {[5, 10, 15].map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.pctBtn, pct === v && styles.pctBtnActive]}
                      onPress={() => setPct(v)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pctText, pct === v && styles.pctTextActive]}>{v}%</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {parseFloat(precio) > 0 ? (
                  <Text style={styles.pctPreview}>
                    Comisión: ${Math.round((parseFloat(precio) * pct) / 100)} · El vendedor recibe ${Math.round(parseFloat(precio) * (1 - pct / 100))}
                  </Text>
                ) : null}
                <TouchableOpacity style={[styles.actionBtn, styles.submitBtn]} onPress={proponerPrecio} disabled={loading}>
                  {loading ? <ActivityIndicator color={W.surface} /> : (
                    <>
                      <Ionicons name="send" size={15} color={W.surface} />
                      <Text style={styles.submitText}>Enviar propuesta</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {isAceptado ? (
              <View>
                <Text style={styles.formTitle}>Gestionar seguro</Text>
                <Text style={styles.bodyText}>
                  El vendedor aceptó el precio. Contratá el seguro; cuando todos los ítems estén
                  asegurados, poné la subasta en vivo desde el botón de arriba.
                </Text>
                <View style={[styles.seguroRow, { borderColor: item.polizaNro ? W.success : W.border }]}>
                  <Ionicons
                    name={item.polizaNro ? 'shield-checkmark' : 'shield-outline'}
                    size={18}
                    color={item.polizaNro ? W.success : W.textSub}
                  />
                  <Text style={styles.seguroText}>
                    {item.polizaNro ? `Seguro contratado · listo para publicar` : 'Sin seguro contratado'}
                  </Text>
                </View>
                {!item.polizaNro ? (
                  <TouchableOpacity style={[styles.actionBtn, styles.submitBtn]} onPress={() => post('seguro', 'Seguro contratado.')} disabled={loading}>
                    {loading ? <ActivityIndicator color={W.surface} /> : (
                      <>
                        <Ionicons name="shield-checkmark-outline" size={15} color={W.surface} />
                        <Text style={styles.submitText}>Contratar seguro</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {!isPendiente && !isAprobada && !isAceptado ? (
              <Text style={styles.readonlyNote}>
                Este ítem ya fue procesado. Estado actual: {est.label.toLowerCase()}.
                {item.motivoRechazo ? `\nMotivo: ${item.motivoRechazo}` : ''}
              </Text>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </RNSafeAreaView>
    </Modal>
  );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export function AdminSubastaDetalleScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const loteId = route.params?.loteId as number;
  const { token } = useAuthStore();

  const [lote, setLote] = useState<Lote | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Item | null>(null);

  const fetchLote = useCallback(async () => {
    try {
      const res = await axios.get<Lote>(`${API_BASE_URL}/admin/lotes/${loteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLote(res.data);
      // Si el modal está abierto, sincronizar el ítem seleccionado
      setSelected((prev) => (prev ? res.data.items?.find((i) => i.id === prev.id) ?? null : null));
    } catch {
      Alert.alert('Error', 'No se pudo cargar la subasta.');
    } finally {
      setLoading(false);
    }
  }, [loteId, token]);

  useFocusEffect(
    useCallback(() => {
      fetchLote();
    }, [fetchLote])
  );

  const portada = lote?.fotoPortadaUrl
    ? (lote.fotoPortadaUrl.startsWith('/') ? `${API_BASE_URL}${lote.fotoPortadaUrl}` : lote.fotoPortadaUrl)
    : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={W.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Revisar subasta</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={W.accent} />
        </View>
      ) : !lote ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se encontró la subasta.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {portada ? (
            <Image source={{ uri: portada }} style={styles.portada} resizeMode="cover" />
          ) : (
            <View style={[styles.portada, styles.portadaPlaceholder]}>
              <Ionicons name="images-outline" size={40} color={W.textSub} />
            </View>
          )}
          <Text style={styles.titulo}>{lote.titulo || 'Subasta sin título'}</Text>
          {lote.duenioNombre ? <Text style={styles.subtitulo}>Vendedor: {lote.duenioNombre}</Text> : null}
          {lote.categoria ? (
            <Text style={styles.subtitulo}>Categoría: {CATEGORIA_LABELS[lote.categoria] ?? lote.categoria}</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Ítems ({lote.items?.length ?? 0})</Text>
          <Text style={styles.sectionHint}>
            Aprobá, tasá y asegurá cada ítem. Cuando estén listos, armá la subasta desde "Armar subasta".
          </Text>

          {(lote.items ?? []).map((item) => {
            const est = estadoItem(item.disponible);
            const img = item.imagenUrl
              ? (item.imagenUrl.startsWith('/') ? `${API_BASE_URL}${item.imagenUrl}` : item.imagenUrl)
              : undefined;
            return (
              <TouchableOpacity key={item.id} style={styles.itemCard} activeOpacity={0.8} onPress={() => setSelected(item)}>
                <View style={styles.itemThumb}>
                  {img ? (
                    <Image source={{ uri: img }} style={styles.itemThumbImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.itemThumbPlaceholder}>
                      <Ionicons name="cube-outline" size={22} color={W.textSub} />
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.descripcion}</Text>
                  <View style={[styles.badge, { borderColor: est.color, marginTop: 4 }]}>
                    <Text style={[styles.badgeText, { color: est.color }]}>{est.label}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={W.textSub} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <RevisarItemModal
        item={selected}
        token={token}
        onClose={() => setSelected(null)}
        onDone={() => {
          setSelected(null);
          fetchLote();
        }}
      />
    </SafeAreaView>
  );
}

export default AdminSubastaDetalleScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: W.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: W.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  errorText: { color: W.textSub },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  portada: { width: '100%', height: 170, borderRadius: 14, marginBottom: spacing.md },
  portadaPlaceholder: { backgroundColor: W.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: W.border },
  titulo: { fontSize: 20, fontWeight: '800', color: W.text, marginBottom: 4 },
  subtitulo: { fontSize: 13, color: W.textSub, marginBottom: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: W.text, marginTop: spacing.lg, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: W.textSub, marginBottom: spacing.md },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: W.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: W.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  itemThumb: { width: 64, height: 64, borderRadius: borderRadius.md, overflow: 'hidden', flexShrink: 0 },
  itemThumbImg: { width: '100%', height: '100%' },
  itemThumbPlaceholder: { width: '100%', height: '100%', backgroundColor: W.surface, justifyContent: 'center', alignItems: 'center' },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: W.text },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Modal
  modalSafe: { flex: 1, backgroundColor: W.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: W.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: W.text },
  modalScroll: { padding: spacing.base, paddingBottom: 60 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: W.textSub, textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.xs },
  bodyText: { fontSize: 14, color: W.text, lineHeight: 20 },
  fotosRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.base },
  foto: { width: 110, height: 110, borderRadius: borderRadius.md, backgroundColor: W.card },
  fotoPlaceholder: { width: 110, height: 110, borderRadius: borderRadius.md, backgroundColor: W.card, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: W.border, marginVertical: spacing.lg },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  approveBtn: { backgroundColor: W.success },
  approveText: { color: W.surface, fontSize: 14, fontWeight: '700' },
  rejectBtn: { borderWidth: 1.5, borderColor: W.error, backgroundColor: 'transparent' },
  rejectText: { color: W.error, fontSize: 14, fontWeight: '700' },
  ghostBtn: { borderWidth: 1, borderColor: W.border, backgroundColor: 'transparent' },
  ghostText: { color: W.textSub, fontSize: 14, fontWeight: '600' },
  confirmRejectBtn: { backgroundColor: W.error },
  confirmRejectText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  formTitle: { fontSize: 16, fontWeight: '700', color: W.text, marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: W.text, marginTop: spacing.sm, marginBottom: spacing.xs },
  inputWrap: {
    backgroundColor: W.inputBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: W.border,
    paddingHorizontal: 16,
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  inputWrapMulti: { minHeight: 80, paddingVertical: 8, justifyContent: 'flex-start' },
  input: { color: W.text, fontSize: 15, paddingVertical: 4 },
  submitBtn: { backgroundColor: W.accent, marginTop: spacing.md },
  submitText: { color: W.surface, fontSize: 14, fontWeight: '700' },
  readonlyNote: { fontSize: 13, color: W.textSub, lineHeight: 19 },
  pctRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  pctBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: W.border,
    backgroundColor: W.card,
  },
  pctBtnActive: { backgroundColor: W.accent, borderColor: W.accent },
  pctText: { fontSize: 15, fontWeight: '700', color: W.textSub },
  pctTextActive: { color: W.surface },
  pctPreview: { fontSize: 12, color: W.textSub, marginBottom: spacing.sm },
  seguroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  seguroText: { fontSize: 13, color: W.text, flex: 1 },
});

