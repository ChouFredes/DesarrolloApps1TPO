import React, { useCallback, useState } from 'react';
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
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { spacing, borderRadius } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { CATEGORIA_LABELS } from './VendedorHomeScreen';
import { estadoLote } from './MisSubastasScreen';
import { VendedorItemsStackParamList } from '../navigation/VendedorNavigator';

const W = {
  bg: '#0F1F35',
  card: '#0D1E33',
  surface: '#0A1626',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  error: '#FF6B6B',
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
  items: Item[];
}

interface FotoNueva {
  uri: string;
  dataUrl: string;
}

const EDITABLES = ['pendiente_inspeccion', 'rechazado', 'rechazado_por_usuario'];

function estadoItem(estado: string): { label: string; color: string } {
  switch (estado) {
    case 'pendiente_inspeccion':
      return { label: 'En revisión', color: '#FFB454' };
    case 'inspeccion_aprobada':
      return { label: 'Inspección aprobada', color: '#7ED957' };
    case 'propuesta_enviada':
      return { label: 'Propuesta de precio', color: '#B794F6' };
    case 'aceptado_por_usuario':
      return { label: 'Aceptada', color: '#7ED957' };
    case 'rechazado':
      return { label: 'Rechazado', color: '#FF6B6B' };
    case 'rechazado_por_usuario':
      return { label: 'Propuesta rechazada', color: '#FF6B6B' };
    case 'vendido':
      return { label: 'Vendido', color: '#00EADF' };
    default:
      return { label: estado, color: '#9BA8B5' };
  }
}

type Nav = StackNavigationProp<VendedorItemsStackParamList, 'SubastaDetalleVendedor'>;
type Rt = RouteProp<VendedorItemsStackParamList, 'SubastaDetalleVendedor'>;

export function SubastaDetalleVendedorScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { token } = useAuthStore();
  const loteId = params.loteId;

  const [lote, setLote] = useState<Lote | null>(null);
  const [loading, setLoading] = useState(true);

  // — Modal de edición —
  const [editing, setEditing] = useState<Item | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [descripcionCompleta, setDescripcionCompleta] = useState('');
  const [nuevasFotos, setNuevasFotos] = useState<FotoNueva[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchLote = useCallback(async () => {
    try {
      const res = await axios.get<Lote>(`${API_BASE_URL}/articulos/lotes/${loteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLote(res.data);
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

  const openItem = (item: Item) => {
    if (EDITABLES.includes(item.disponible)) {
      setEditing(item);
      setDescripcion(item.descripcion ?? '');
      setDescripcionCompleta(item.descripcionCompleta ?? '');
      setNuevasFotos([]);
    } else if (item.disponible === 'propuesta_enviada') {
      navigation.navigate('EstadoArticulo', { articuloId: item.id });
    } else {
      navigation.navigate('EstadoArticulo', { articuloId: item.id });
    }
  };

  const pickFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setNuevasFotos((prev) => [
        ...prev,
        { uri: asset.uri, dataUrl: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri },
      ]);
    }
  };

  const removeNuevaFoto = (idx: number) =>
    setNuevasFotos((prev) => prev.filter((_, i) => i !== idx));

  const guardar = async () => {
    if (!editing) return;
    if (!descripcion.trim()) {
      Alert.alert('Falta la descripción', 'Ingresá una descripción para el ítem.');
      return;
    }
    setSaving(true);
    try {
      await axios.put(
        `${API_BASE_URL}/articulos/${editing.id}`,
        {
          descripcionCatalogo: descripcion.trim(),
          descripcionCompleta: descripcionCompleta.trim() || descripcion.trim(),
          categoria: editing.categoria,
          // Solo se reemplazan las fotos si el vendedor cargó nuevas.
          fotosUrls: nuevasFotos.length > 0 ? nuevasFotos.map((f) => f.dataUrl) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditing(null);
      Alert.alert('Listo', 'El ítem se actualizó y vuelve a quedar pendiente de inspección.');
      fetchLote();
    } catch (err: any) {
      const msg = err?.response?.data?.mensaje || err?.response?.data?.detalle || 'No se pudo actualizar el ítem.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const portada = lote?.fotoPortadaUrl
    ? (lote.fotoPortadaUrl.startsWith('/') ? `${API_BASE_URL}${lote.fotoPortadaUrl}` : lote.fotoPortadaUrl)
    : undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={W.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Subasta</Text>
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
          <View style={styles.metaRow}>
            {(() => {
              const e = estadoLote(lote.estado);
              return (
                <View style={[styles.badge, { borderColor: e.color }]}>
                  <Text style={[styles.badgeText, { color: e.color }]}>{e.label}</Text>
                </View>
              );
            })()}
            {lote.categoria ? (
              <Text style={styles.metaText}>{CATEGORIA_LABELS[lote.categoria] ?? lote.categoria}</Text>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>
            Ítems ({lote.items?.length ?? 0})
          </Text>
          <Text style={styles.sectionHint}>
            Tocá un ítem para ver su estado. Los que están en revisión o rechazados los podés editar.
          </Text>

          {(lote.items ?? []).map((item) => {
            const est = estadoItem(item.disponible);
            const img = item.imagenUrl
              ? (item.imagenUrl.startsWith('/') ? `${API_BASE_URL}${item.imagenUrl}` : item.imagenUrl)
              : undefined;
            const editable = EDITABLES.includes(item.disponible);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                activeOpacity={0.8}
                onPress={() => openItem(item)}
              >
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
                  {item.precioBase != null ? (
                    <Text style={styles.itemPrecio}>Precio sugerido: ${item.precioBase}</Text>
                  ) : null}
                  {item.disponible === 'rechazado' && item.motivoRechazo ? (
                    <Text style={styles.itemMotivo} numberOfLines={2}>Motivo: {item.motivoRechazo}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name={editable ? 'pencil-outline' : 'chevron-forward'}
                  size={editable ? 18 : 20}
                  color={editable ? W.accent : W.textSub}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Modal de edición de ítem ── */}
      <Modal
        visible={editing !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditing(null)}
      >
        <RNSafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditing(null)} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={W.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar ítem</Text>
            <TouchableOpacity onPress={guardar} activeOpacity={0.8} disabled={saving}>
              <Text style={styles.modalSave}>{saving ? '...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Descripción</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="Descripción del ítem"
                  placeholderTextColor={W.textSub}
                  value={descripcion}
                  onChangeText={setDescripcion}
                />
              </View>

              <Text style={styles.label}>Descripción detallada</Text>
              <View style={[styles.inputWrap, styles.inputWrapMulti]}>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Detalles, estado, valor estimado..."
                  placeholderTextColor={W.textSub}
                  value={descripcionCompleta}
                  onChangeText={setDescripcionCompleta}
                  multiline
                />
              </View>

              <Text style={styles.label}>Fotos</Text>
              {editing?.fotosUrls && editing.fotosUrls.length > 0 ? (
                <>
                  <Text style={styles.hint}>Fotos actuales</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotosRow}>
                    {editing.fotosUrls.map((u, i) => (
                      <Image
                        key={i}
                        source={{ uri: u.startsWith('/') ? `${API_BASE_URL}${u}` : u }}
                        style={styles.fotoPreview}
                        resizeMode="cover"
                      />
                    ))}
                  </ScrollView>
                </>
              ) : null}

              <Text style={styles.hint}>
                {nuevasFotos.length > 0
                  ? 'Estas fotos nuevas reemplazarán a las actuales al guardar.'
                  : 'Opcional: agregá fotos nuevas para reemplazar las actuales.'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fotosRow}>
                {nuevasFotos.map((f, i) => (
                  <View key={i} style={styles.fotoNuevaWrap}>
                    <Image source={{ uri: f.uri }} style={styles.fotoPreview} resizeMode="cover" />
                    <TouchableOpacity style={styles.fotoRemove} onPress={() => removeNuevaFoto(i)}>
                      <Ionicons name="close-circle" size={20} color={W.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.fotoAdd} onPress={pickFoto} activeOpacity={0.7}>
                  <Ionicons name="add" size={28} color={W.textSub} />
                </TouchableOpacity>
              </ScrollView>

              <PrimaryButton
                title="Guardar cambios"
                onPress={guardar}
                loading={saving}
                style={{ marginTop: spacing.xl }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </RNSafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export default SubastaDetalleVendedorScreen;

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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  errorText: { color: W.textSub, textAlign: 'center' },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  portada: { width: '100%', height: 170, borderRadius: 14, marginBottom: spacing.md },
  portadaPlaceholder: { backgroundColor: W.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: W.border },
  titulo: { fontSize: 20, fontWeight: '800', color: W.text, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  metaText: { fontSize: 13, color: W.textSub },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: W.text, marginBottom: 2 },
  sectionHint: { fontSize: 12, color: W.textSub, marginBottom: spacing.md, lineHeight: 17 },
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
  itemInfo: { flex: 1, gap: 2 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: W.text },
  itemPrecio: { fontSize: 12, color: W.accent, fontWeight: '700', marginTop: 2 },
  itemMotivo: { fontSize: 11, color: W.error, marginTop: 2 },

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
  modalSave: { fontSize: 15, fontWeight: '700', color: W.accent },
  modalScroll: { padding: spacing.base, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: '600', color: W.text, marginTop: spacing.md, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: W.textSub, marginBottom: spacing.sm },
  inputWrap: {
    backgroundColor: W.inputBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: W.border,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  inputWrapMulti: { minHeight: 90, paddingVertical: 8, justifyContent: 'flex-start' },
  input: { color: W.text, fontSize: 15, paddingVertical: 4 },
  fotosRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm, paddingRight: spacing.base },
  fotoPreview: { width: 80, height: 80, borderRadius: borderRadius.md, backgroundColor: W.card },
  fotoNuevaWrap: { width: 80, height: 80, position: 'relative' },
  fotoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: W.surface, borderRadius: 10 },
  fotoAdd: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: W.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: W.card,
  },
});
