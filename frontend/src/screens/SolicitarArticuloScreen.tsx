import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { spacing, borderRadius } from '../theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { CATEGORIA_LABELS } from './VendedorHomeScreen';
import { VendedorItemsStackParamList } from '../navigation/VendedorNavigator';

// ─── Dark palette (same language as VendedorHomeScreen) ────────────────────
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

const MIN_PHOTOS = 1;

// ─── Types ──────────────────────────────────────────────────────────────────
interface MedioPago {
  id: number;
  tipo: string;
  alias?: string;
  numero?: string;
}

interface FotoSeleccionada {
  uri: string;
  dataUrl: string;
}

interface ItemDraft {
  id: string; // local uuid
  descripcion: string;
  valorEstimado: string;
  categoria: string | null;
  fotos: FotoSeleccionada[];
}

type Nav = StackNavigationProp<VendedorItemsStackParamList, 'SolicitarArticulo'>;

// ─── Helpers ────────────────────────────────────────────────────────────────
function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyDraft(): ItemDraft {
  return { id: makeId(), descripcion: '', valorEstimado: '', categoria: null, fotos: [] };
}

// ─── Component ──────────────────────────────────────────────────────────────
export function SolicitarArticuloScreen() {
  const navigation = useNavigation<Nav>();
  const { token, user } = useAuthStore();

  // — Subasta-level state —
  const [titulo, setTitulo] = useState('');
  const [portada, setPortada] = useState<FotoSeleccionada | null>(null);
  const [cuentaDestinoId, setCuentaDestinoId] = useState<number | null>(null);
  const [mediosDePago, setMediosDePago] = useState<MedioPago[]>([]);
  const [loadingMedios, setLoadingMedios] = useState(true);
  const [categoriasPermitidas, setCategoriasPermitidas] = useState<string[]>([]);
  const [declaracion, setDeclaracion] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // — Items list —
  const [items, setItems] = useState<ItemDraft[]>([]);

  // — Item editor modal —
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDraft, setEditingDraft] = useState<ItemDraft>(emptyDraft());
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = new item
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  // ── Fetch categorías once ───────────────────────────────────────────────
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/vendedores/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setCategoriasPermitidas(res.data.categoriasPermitidas ?? []))
      .catch(() => {});
  }, [token]);

  // ── Fetch medios de pago on focus (so return from AgregarMedioPago refreshes) ─
  const fetchMedios = useCallback(async () => {
    if (!user?.id) return;
    setLoadingMedios(true);
    try {
      const res = await axios.get<MedioPago[]>(
        `${API_BASE_URL}/usuarios/me/medios-de-pago`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMediosDePago(res.data);
      if (res.data.length > 0 && !cuentaDestinoId) {
        setCuentaDestinoId(res.data[0].id);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMedios(false);
    }
  }, [token, user, cuentaDestinoId]);

  useFocusEffect(
    useCallback(() => {
      fetchMedios();
    }, [fetchMedios])
  );

  // ── Cover photo picker ──────────────────────────────────────────────────
  const pickPortada = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para adjuntar fotos.');
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
      setPortada({
        uri: asset.uri,
        dataUrl: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
      });
    }
  };

  // ── Item photo picker (inside modal) ────────────────────────────────────
  const pickItemPhoto = async (index: number) => {
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
      const nueva: FotoSeleccionada = {
        uri: asset.uri,
        dataUrl: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri,
      };
      setEditingDraft((prev) => {
        const next = [...prev.fotos];
        if (index < next.length) {
          next[index] = nueva;
        } else {
          next.push(nueva);
        }
        return { ...prev, fotos: next };
      });
    }
  };

  const removeItemPhoto = (index: number) => {
    setEditingDraft((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index),
    }));
  };

  // ── Open editor ─────────────────────────────────────────────────────────
  const openNewItem = () => {
    setEditingDraft(emptyDraft());
    setEditingIndex(null);
    setDraftErrors({});
    setModalVisible(true);
  };

  const openEditItem = (idx: number) => {
    setEditingDraft({ ...items[idx] });
    setEditingIndex(idx);
    setDraftErrors({});
    setModalVisible(true);
  };

  const removeItem = (idx: number) => {
    Alert.alert('Eliminar ítem', '¿Querés eliminar este ítem?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => setItems((prev) => prev.filter((_, i) => i !== idx)),
      },
    ]);
  };

  // ── Validate & save item draft ───────────────────────────────────────────
  const saveDraft = () => {
    const errs: Record<string, string> = {};
    if (!editingDraft.descripcion.trim()) errs.descripcion = 'La descripción es requerida.';
    if (
      !editingDraft.valorEstimado.trim() ||
      isNaN(Number(editingDraft.valorEstimado)) ||
      Number(editingDraft.valorEstimado) <= 0
    ) {
      errs.valorEstimado = 'Ingresá un valor estimado válido.';
    }
    if (!editingDraft.categoria) errs.categoria = 'Seleccioná una categoría.';
    if (editingDraft.fotos.length < MIN_PHOTOS) {
      errs.fotos = `Debés adjuntar al menos ${MIN_PHOTOS} fotos.`;
    }
    setDraftErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (editingIndex !== null) {
      // editing existing
      setItems((prev) => prev.map((it, i) => (i === editingIndex ? editingDraft : it)));
    } else {
      setItems((prev) => [...prev, editingDraft]);
    }
    setModalVisible(false);
  };

  // ── Main form validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!titulo.trim()) newErrors.titulo = 'El título de la subasta es requerido.';
    if (items.length === 0) {
      newErrors.items = 'Agregá al menos un ítem a la subasta.';
    } else if (items.length > 10) {
      newErrors.items = 'Una subasta puede tener hasta 10 ítems.';
    }
    if (mediosDePago.length > 0 && !cuentaDestinoId) {
      newErrors.cuenta = 'Seleccioná una cuenta destino.';
    }
    if (!declaracion) newErrors.declaracion = 'Debés aceptar la declaración de propiedad.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/articulos/lote`,
        {
          titulo: titulo.trim(),
          fotoPortadaUrl: portada?.dataUrl ?? null,
          cuentaDestinoId,
          items: items.map((it) => ({
            descripcion: it.descripcion.trim(),
            descripcionCompleta: `${it.descripcion.trim()} — Valor estimado: $${it.valorEstimado}`,
            categoria: it.categoria,
            fotosUrls: it.fotos.map((f) => f.dataUrl),
            cuentaDestinoId,
            declaraPropiedad: true,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        'Subasta enviada',
        'Tu subasta fue enviada para revisión. Te notificaremos cuando sea procesada.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.detalle ||
        err?.response?.data?.mensaje ||
        err?.response?.data?.message ||
        'Ocurrió un error al enviar la subasta. Intente nuevamente.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Item photo slots (inside modal) ─────────────────────────────────────
  const itemPhotoSlots = Array.from({
    length: Math.max(MIN_PHOTOS, editingDraft.fotos.length + 1),
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={W.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Armar Subasta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Foto de portada ── */}
        <Text style={styles.sectionTitle}>Foto de portada de la subasta</Text>
        <Text style={styles.sectionHint}>Opcional — imagen principal de la subasta</Text>
        <TouchableOpacity style={styles.portadaBtn} onPress={pickPortada} activeOpacity={0.8}>
          {portada ? (
            <Image source={{ uri: portada.uri }} style={styles.portadaImg} resizeMode="cover" />
          ) : (
            <View style={styles.portadaPlaceholder}>
              <Ionicons name="image-outline" size={36} color={W.accent} />
              <Text style={styles.portadaPlaceholderText}>Seleccionar foto de portada</Text>
            </View>
          )}
          {portada && (
            <TouchableOpacity
              style={styles.portadaRemove}
              onPress={() => setPortada(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={24} color={W.error} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* ── Título ── */}
        <Text style={styles.label}>Título de la subasta</Text>
        <View style={[styles.inputWrap, errors.titulo ? styles.inputWrapError : null]}>
          <TextInput
            style={styles.input}
            placeholder="Ej: Lote de Pokémon legendarios"
            placeholderTextColor={W.textSub}
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>
        {errors.titulo ? <Text style={styles.errorMsg}>{errors.titulo}</Text> : null}

        {/* ── Cuenta destino ── */}
        <Text style={styles.label}>Cuenta destino</Text>
        {loadingMedios ? (
          <ActivityIndicator size="small" color={W.accent} style={{ marginBottom: spacing.base }} />
        ) : mediosDePago.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="card-outline" size={22} color={W.textSub} />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyCardText}>No tenés medios de pago registrados.</Text>
            </View>
            <TouchableOpacity
              style={styles.registrarBtn}
              onPress={() => (navigation as any).navigate('PerfilTab', { screen: 'MetodosDePago' })}
              activeOpacity={0.8}
            >
              <Text style={styles.registrarBtnText}>Registrar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.pickerContainer}>
            {mediosDePago.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.pickerOption, cuentaDestinoId === m.id && styles.pickerOptionActive]}
                onPress={() => setCuentaDestinoId(m.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={cuentaDestinoId === m.id ? W.accent : W.textSub}
                />
                <Text
                  style={[
                    styles.pickerOptionText,
                    cuentaDestinoId === m.id && styles.pickerOptionTextActive,
                  ]}
                >
                  {m.alias ?? m.tipo} {m.numero ? `••${m.numero.slice(-4)}` : ''}
                </Text>
                {cuentaDestinoId === m.id && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={W.accent}
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {errors.cuenta ? <Text style={styles.errorMsg}>{errors.cuenta}</Text> : null}

        {/* ── Ítems ── */}
        <View style={styles.itemsHeader}>
          <Text style={styles.label}>Ítems de la subasta</Text>
          <Text style={styles.itemsCount}>{items.length} ítem{items.length !== 1 ? 's' : ''}</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={22} color={W.textSub} />
            <Text style={styles.emptyCardText}>Todavía no agregaste ítems.</Text>
          </View>
        ) : (
          items.map((item, idx) => (
            <View key={item.id} style={styles.itemCard}>
              {item.fotos.length > 0 && (
                <Image source={{ uri: item.fotos[0].uri }} style={styles.itemThumb} resizeMode="cover" />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {item.descripcion}
                </Text>
                <Text style={styles.itemMeta}>
                  {CATEGORIA_LABELS[item.categoria ?? ''] ?? item.categoria} •{' '}
                  {item.fotos.length} foto{item.fotos.length !== 1 ? 's' : ''}
                </Text>
                <Text style={styles.itemValor}>${item.valorEstimado}</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => openEditItem(idx)} activeOpacity={0.7}>
                  <Ionicons name="pencil-outline" size={20} color={W.accent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(idx)} activeOpacity={0.7} style={{ marginTop: 10 }}>
                  <Ionicons name="trash-outline" size={20} color={W.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {errors.items ? <Text style={styles.errorMsg}>{errors.items}</Text> : null}

        {items.length < 10 && (
          <TouchableOpacity style={styles.addItemBtn} onPress={openNewItem} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={20} color={W.accent} />
            <Text style={styles.addItemBtnText}>+ Agregar ítem</Text>
          </TouchableOpacity>
        )}

        {/* ── Declaración de propiedad ── */}
        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setDeclaracion(!declaracion)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, declaracion && styles.checkboxChecked]}>
            {declaracion && <Ionicons name="checkmark" size={14} color={W.surface} />}
          </View>
          <Text style={styles.checkLabel}>
            Declaro ser el propietario de todos los artículos y acepto los{' '}
            <Text style={styles.checkLabelLink}>términos y condiciones</Text>
          </Text>
        </TouchableOpacity>
        {errors.declaracion ? <Text style={styles.errorMsg}>{errors.declaracion}</Text> : null}

        {/* ── Submit ── */}
        <PrimaryButton
          title="Publicar subasta"
          onPress={handleSubmit}
          loading={submitting}
          style={styles.submitBtn}
        />
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════
          ITEM EDITOR MODAL
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          {/* Modal header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
              <Ionicons name="close" size={24} color={W.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? 'Editar ítem' : 'Nuevo ítem'}
            </Text>
            <TouchableOpacity onPress={saveDraft} activeOpacity={0.8}>
              <Text style={styles.modalSaveBtn}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Descripción */}
              <Text style={styles.label}>Descripción</Text>
              <View style={[styles.inputWrap, styles.inputWrapMulti, draftErrors.descripcion ? styles.inputWrapError : null]}>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  placeholder="Describí el ítem..."
                  placeholderTextColor={W.textSub}
                  value={editingDraft.descripcion}
                  onChangeText={(v) => setEditingDraft((p) => ({ ...p, descripcion: v }))}
                  multiline
                  numberOfLines={4}
                />
              </View>
              {draftErrors.descripcion ? (
                <Text style={styles.errorMsg}>{draftErrors.descripcion}</Text>
              ) : null}

              {/* Valor estimado */}
              <Text style={styles.label}>Valor estimado ($)</Text>
              <View style={[styles.inputWrap, draftErrors.valorEstimado ? styles.inputWrapError : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 50000"
                  placeholderTextColor={W.textSub}
                  value={editingDraft.valorEstimado}
                  onChangeText={(v) => setEditingDraft((p) => ({ ...p, valorEstimado: v }))}
                  keyboardType="numeric"
                />
              </View>
              {draftErrors.valorEstimado ? (
                <Text style={styles.errorMsg}>{draftErrors.valorEstimado}</Text>
              ) : null}

              {/* Categoría */}
              <Text style={styles.label}>Categoría</Text>
              {categoriasPermitidas.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="layers-outline" size={20} color={W.textSub} />
                  <Text style={styles.emptyCardText}>Cargando categorías...</Text>
                </View>
              ) : (
                <View style={styles.categoriasWrap}>
                  {categoriasPermitidas.map((cat) => {
                    const active = editingDraft.categoria === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoriaPill, active && styles.categoriaPillActive]}
                        onPress={() => setEditingDraft((p) => ({ ...p, categoria: cat }))}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[styles.categoriaPillText, active && styles.categoriaPillTextActive]}
                        >
                          {CATEGORIA_LABELS[cat] ?? cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {draftErrors.categoria ? (
                <Text style={styles.errorMsg}>{draftErrors.categoria}</Text>
              ) : null}

              {/* Fotos del ítem */}
              <View style={styles.fotosHeader}>
                <Text style={styles.label}>Fotos del ítem</Text>
                <Text style={styles.fotosCount}>
                  {editingDraft.fotos.length}/{MIN_PHOTOS} mínimo
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fotosRow}
              >
                {itemPhotoSlots.map((_, index) => {
                  const uri = editingDraft.fotos[index]?.uri;
                  const isAdd = !uri;
                  return (
                    <View key={index} style={styles.fotoSlot}>
                      {isAdd ? (
                        <TouchableOpacity
                          style={styles.fotoPlaceholder}
                          onPress={() => pickItemPhoto(index)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="add" size={28} color={W.textSub} />
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.fotoPreviewContainer}>
                          <Image source={{ uri }} style={styles.fotoPreview} resizeMode="cover" />
                          <TouchableOpacity
                            style={styles.removePhotoBtn}
                            onPress={() => removeItemPhoto(index)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="close-circle" size={20} color={W.error} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
              {draftErrors.fotos ? (
                <Text style={styles.errorMsg}>{draftErrors.fotos}</Text>
              ) : null}

              {/* Guardar button (bottom of modal scroll) */}
              <PrimaryButton
                title={editingIndex !== null ? 'Actualizar ítem' : 'Guardar ítem'}
                onPress={saveDraft}
                style={{ marginTop: spacing.xl }}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

export default SolicitarArticuloScreen;

const styles = StyleSheet.create({
  // ── Screen ──
  safe: { flex: 1, backgroundColor: W.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: W.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: W.text,
  },
  scrollContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 60,
    paddingTop: spacing.base,
  },

  // ── Section labels ──
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: W.text,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 12,
    color: W.textSub,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: W.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // ── Portada ──
  portadaBtn: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.base,
    position: 'relative',
  },
  portadaImg: {
    width: '100%',
    height: '100%',
  },
  portadaPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: W.card,
    borderWidth: 1.5,
    borderColor: W.border,
    borderStyle: 'dashed',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  portadaPlaceholderText: {
    color: W.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  portadaRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: W.surface,
    borderRadius: 12,
  },

  // ── Generic input ──
  inputWrap: {
    backgroundColor: W.inputBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: W.border,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  inputWrapMulti: {
    minHeight: 90,
    paddingVertical: 8,
    justifyContent: 'flex-start',
  },
  inputWrapError: {
    borderColor: W.error,
  },
  input: {
    color: W.text,
    fontSize: 15,
    paddingVertical: 4,
  },

  // ── Errors ──
  errorMsg: {
    fontSize: 12,
    color: W.error,
    marginTop: 2,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },

  // ── Empty state card ──
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: W.card,
    borderWidth: 1,
    borderColor: W.border,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  emptyCardText: {
    fontSize: 13,
    color: W.textSub,
    flex: 1,
  },

  // ── Registrar medio de pago button ──
  registrarBtn: {
    backgroundColor: W.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  registrarBtnText: {
    color: W.surface,
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Picker / medios de pago ──
  pickerContainer: {
    backgroundColor: W.card,
    borderRadius: 12,
    marginBottom: spacing.base,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: W.border,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: W.border,
  },
  pickerOptionActive: {
    backgroundColor: 'rgba(0,234,223,0.08)',
  },
  pickerOptionText: {
    fontSize: 14,
    color: W.textSub,
  },
  pickerOptionTextActive: {
    color: W.text,
    fontWeight: '600',
  },

  // ── Items list ──
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  itemsCount: {
    fontSize: 12,
    color: W.textSub,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: W.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: W.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  itemThumb: {
    width: 72,
    height: 72,
  },
  itemInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  itemDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: W.text,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 11,
    color: W.textSub,
    marginBottom: 2,
  },
  itemValor: {
    fontSize: 13,
    fontWeight: '700',
    color: W.accent,
  },
  itemActions: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Add item button ──
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: W.accent,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: spacing.base,
    marginBottom: spacing.md,
    backgroundColor: 'rgba(0,234,223,0.05)',
  },
  addItemBtnText: {
    color: W.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Checkbox ──
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: W.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: W.accent,
    borderColor: W.accent,
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: W.textSub,
    lineHeight: 20,
  },
  checkLabelLink: {
    color: W.accent,
    fontWeight: '600',
  },

  // ── Submit button ──
  submitBtn: {
    marginTop: spacing.lg,
  },

  // ── Categorías ──
  categoriasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  categoriaPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: W.border,
    backgroundColor: W.card,
  },
  categoriaPillActive: {
    backgroundColor: W.accent,
    borderColor: W.accent,
  },
  categoriaPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: W.textSub,
  },
  categoriaPillTextActive: {
    color: W.surface,
    fontWeight: '700',
  },

  // ── Fotos (inside modal) ──
  fotosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  fotosCount: {
    fontSize: 12,
    color: W.textSub,
  },
  fotosRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    paddingRight: spacing.base,
  },
  fotoSlot: {
    width: 90,
    height: 90,
  },
  fotoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: W.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: W.card,
  },
  fotoPreviewContainer: {
    width: 90,
    height: 90,
    position: 'relative',
  },
  fotoPreview: {
    width: 90,
    height: 90,
    borderRadius: borderRadius.md,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: W.surface,
    borderRadius: 10,
  },

  // ── Modal ──
  modalSafe: {
    flex: 1,
    backgroundColor: W.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: W.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: W.text,
  },
  modalSaveBtn: {
    fontSize: 15,
    fontWeight: '700',
    color: W.accent,
  },
  modalScroll: {
    paddingHorizontal: spacing.base,
    paddingBottom: 60,
    paddingTop: spacing.sm,
  },
});
