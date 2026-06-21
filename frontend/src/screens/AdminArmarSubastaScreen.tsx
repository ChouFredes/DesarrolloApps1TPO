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
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { spacing, borderRadius } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';
import { CATEGORIA_LABELS } from './VendedorHomeScreen';

const W = {
  bg: '#0F1F35', card: '#0D1E33', surface: '#0A1626', text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)', accent: '#00EADF', border: 'rgba(0,234,223,0.2)', error: '#FF6B6B',
  inputBg: '#152C44',
};

interface ItemListo {
  id: number;
  descripcion: string;
  categoria?: string | null;
  precioBase?: number | null;
  duenioId?: number | null;
  duenioNombre?: string | null;
  imagenUrl?: string | null;
}

export function AdminArmarSubastaScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [items, setItems] = useState<ItemListo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<string | null>(null);
  const [dias, setDias] = useState(3);
  const [portada, setPortada] = useState<{ uri: string; dataUrl: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickPortada = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para la foto de portada.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const a = result.assets[0];
      setPortada({ uri: a.uri, dataUrl: a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri });
    }
  };

  const fetchListos = useCallback(async () => {
    try {
      const res = await axios.get<ItemListo[]>(`${API_BASE_URL}/admin/articulos/listos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data ?? []);
    } catch {
      // pull-to-refresh reintenta
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchListos(); }, [fetchListos]));

  const toggle = (item: ItemListo) => {
    setSelected((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
    );
  };

  const armar = async () => {
    if (selected.length === 0) {
      Alert.alert('Sin ítems', 'Seleccioná al menos un ítem para armar la subasta.');
      return;
    }
    if (!categoria) {
      Alert.alert('Falta la categoría', 'Elegí la categoría de la subasta.');
      return;
    }
    if (!portada) {
      Alert.alert('Falta la portada', 'Elegí una foto de portada para la subasta.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE_URL}/admin/subastas/armar`, {
        titulo: titulo.trim(),
        categoria,
        dias,
        fotoPortadaUrl: portada.dataUrl,
        itemIds: selected,
      }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert(
        'Subasta armada',
        `Queda en vivo por ${dias} día${dias > 1 ? 's' : ''} y ya es visible para los compradores de la categoría o superior.`,
        [{ text: 'OK', onPress: () => { setSelected([]); setTitulo(''); setPortada(null); setCategoria(null); fetchListos(); } }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.mensaje || 'No se pudo armar la subasta.');
    } finally {
      setSubmitting(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchListos(); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={W.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Armar subasta</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={W.accent} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />}
        >
          <Text style={styles.label}>Foto de portada</Text>
          <TouchableOpacity style={styles.portadaBtn} onPress={pickPortada} activeOpacity={0.85}>
            {portada ? (
              <Image source={{ uri: portada.uri }} style={styles.portadaImg} resizeMode="cover" />
            ) : (
              <View style={styles.portadaPh}>
                <Ionicons name="image-outline" size={34} color={W.accent} />
                <Text style={styles.portadaPhText}>Elegí una foto para la subasta</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Título (opcional)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder='Ej: "Colección García" o "Joyas de autor"'
              placeholderTextColor={W.textSub}
              value={titulo}
              onChangeText={setTitulo}
            />
          </View>

          <Text style={styles.label}>Categoría de la subasta</Text>
          <View style={styles.catWrap}>
            {Object.keys(CATEGORIA_LABELS).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, categoria === cat && styles.pillActive]}
                onPress={() => setCategoria(cat)}
                activeOpacity={0.8}
              >
                <Text style={[styles.catPillText, categoria === cat && styles.pillTextActive]}>
                  {CATEGORIA_LABELS[cat]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duración</Text>
          <View style={styles.pillRow}>
            {[1, 3, 7].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.pill, dias === d && styles.pillActive]}
                onPress={() => setDias(d)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, dias === d && styles.pillTextActive]}>{d} día{d > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.itemsHeader}>
            <Text style={styles.label}>Ítems listos</Text>
            <Text style={styles.metaText}>
              {selected.length} sel.{categoria ? ` · ${CATEGORIA_LABELS[categoria] ?? categoria}` : ''}
            </Text>
          </View>
          <Text style={styles.hint}>Aceptados por el vendedor y asegurados. La categoría de la subasta la elegís arriba.</Text>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={W.textSub} />
              <Text style={styles.emptyText}>No hay ítems listos todavía. Aprobá, tasá y asegurá ítems primero.</Text>
            </View>
          ) : (
            items.map((item) => {
              const on = selected.includes(item.id);
              const img = item.imagenUrl
                ? (item.imagenUrl.startsWith('/') ? `${API_BASE_URL}${item.imagenUrl}` : item.imagenUrl)
                : undefined;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemCard, on && styles.itemCardOn]}
                  activeOpacity={0.8}
                  onPress={() => toggle(item)}
                >
                  <View style={[styles.check, on && styles.checkOn]}>
                    {on && <Ionicons name="checkmark" size={15} color={W.surface} />}
                  </View>
                  <View style={styles.thumb}>
                    {img ? (
                      <Image source={{ uri: img }} style={styles.thumbImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.thumbPh}><Ionicons name="cube-outline" size={20} color={W.textSub} /></View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemDesc} numberOfLines={2}>{item.descripcion}</Text>
                    <Text style={styles.itemMeta}>
                      {item.duenioNombre ?? 'Dueño'} · {item.categoria ? (CATEGORIA_LABELS[item.categoria] ?? item.categoria) : 's/cat'}
                    </Text>
                    {item.precioBase != null ? <Text style={styles.itemPrecio}>Base: ${item.precioBase}</Text> : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {selected.length > 0 ? (
            <TouchableOpacity style={styles.armarBtn} onPress={armar} disabled={submitting} activeOpacity={0.85}>
              {submitting ? <ActivityIndicator color={W.surface} /> : (
                <>
                  <Ionicons name="hammer-outline" size={16} color={W.surface} />
                  <Text style={styles.armarText}>Armar subasta ({selected.length})</Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default AdminArmarSubastaScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: W.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: W.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.base, paddingBottom: spacing.xxl },
  label: { fontSize: 14, fontWeight: '600', color: W.text, marginTop: spacing.md, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: W.textSub, marginBottom: spacing.md },
  metaText: { fontSize: 12, color: W.accent, fontWeight: '700' },
  inputWrap: {
    backgroundColor: W.inputBg, borderRadius: 12, borderWidth: 0.5, borderColor: W.border,
    paddingHorizontal: 16, minHeight: 50, justifyContent: 'center',
  },
  input: { color: W.text, fontSize: 15, paddingVertical: 4 },
  portadaBtn: { width: '100%', height: 150, borderRadius: 14, overflow: 'hidden' },
  portadaImg: { width: '100%', height: '100%' },
  portadaPh: {
    width: '100%', height: '100%', backgroundColor: W.card,
    borderWidth: 1.5, borderColor: W.border, borderStyle: 'dashed', borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  portadaPhText: { color: W.accent, fontSize: 13, fontWeight: '600' },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  catPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999,
    borderWidth: 1, borderColor: W.border, backgroundColor: W.card,
  },
  catPillText: { fontSize: 13, fontWeight: '600', color: W.textSub },
  pillRow: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: 12,
    borderWidth: 1, borderColor: W.border, backgroundColor: W.card,
  },
  pillActive: { backgroundColor: W.accent, borderColor: W.accent },
  pillText: { fontSize: 14, fontWeight: '700', color: W.textSub },
  pillTextActive: { color: W.surface },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: W.card, borderRadius: 12, borderWidth: 1, borderColor: W.border,
    padding: spacing.md, marginBottom: spacing.md,
  },
  itemCardOn: { borderColor: W.accent, backgroundColor: 'rgba(0,234,223,0.06)' },
  check: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: W.border,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  checkOn: { backgroundColor: W.accent, borderColor: W.accent },
  thumb: { width: 54, height: 54, borderRadius: borderRadius.md, overflow: 'hidden', flexShrink: 0 },
  thumbImg: { width: '100%', height: '100%' },
  thumbPh: { width: '100%', height: '100%', backgroundColor: W.surface, justifyContent: 'center', alignItems: 'center' },
  itemDesc: { fontSize: 14, fontWeight: '600', color: W.text },
  itemMeta: { fontSize: 12, color: W.textSub, marginTop: 2 },
  itemPrecio: { fontSize: 12, color: W.accent, fontWeight: '700', marginTop: 2 },
  empty: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyText: { fontSize: 13, color: W.textSub, textAlign: 'center', lineHeight: 19 },
  armarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: W.accent, borderRadius: 14, paddingVertical: spacing.base, marginTop: spacing.lg,
  },
  armarText: { color: W.surface, fontSize: 15, fontWeight: '700' },
});
