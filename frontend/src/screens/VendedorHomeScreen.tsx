import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { spacing } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { API_BASE_URL } from '../config/api';

const W = {
  bg: '#0F1F35',
  card: '#0D1E33',
  surface: '#0A1626',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
};

const ROTOM_IMG = require('../../assets/pokeballs/rotom.png');

export const NIVEL_COLORS: Record<string, string> = {
  comun: '#9BA8B5',
  especial: '#7ED957',
  plata: '#C8D1DC',
  oro: '#FFD166',
  platino: '#00EADF',
};

export const CATEGORIA_LABELS: Record<string, string> = {
  pokemon: 'Pokémon',
  maquinas_tecnicas: 'Máquinas Técnicas',
  pociones: 'Pociones',
  arte: 'Arte',
  electronica: 'Electrónica',
  inmuebles: 'Inmuebles',
  vehiculos: 'Vehículos',
  joyas: 'Joyas',
  antiguedades: 'Antigüedades',
  otros: 'Otros',
};

export function VendedorHomeScreen() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const [categoriasPermitidas, setCategoriasPermitidas] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const perfilRes = await axios.get(`${API_BASE_URL}/vendedores/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriasPermitidas(perfilRes.data.categoriasPermitidas ?? []);
    } catch {
      // se reintenta con pull-to-refresh
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const nivel = user?.nivel ?? 'comun';
  const nivelColor = NIVEL_COLORS[nivel] ?? W.accent;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={W.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hola, {user?.nombre}</Text>
            <Text style={styles.subtitle}>Panel de vendedor</Text>
          </View>
          <Image source={ROTOM_IMG} style={styles.rotom} resizeMode="contain" />
        </View>

        {/* Nivel */}
        <View style={[styles.nivelCard, { borderColor: nivelColor }]}>
          <Ionicons name="medal-outline" size={26} color={nivelColor} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nivelLabel}>Tu categoría de vendedor</Text>
            <Text style={[styles.nivelValue, { color: nivelColor }]}>{nivel.toUpperCase()}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ItemsTab', { screen: 'SolicitarArticulo' })}
        >
          <Ionicons name="add-circle" size={24} color="#0A1626" />
          <Text style={styles.ctaText}>Agregar ítem para subastar</Text>
        </TouchableOpacity>

        {/* Categorías permitidas */}
        <Text style={styles.sectionTitle}>Podés publicar en estas categorías</Text>
        <View style={styles.chipsWrap}>
          {categoriasPermitidas.length === 0 ? (
            <Text style={styles.emptyText}>Cargando categorías...</Text>
          ) : (
            categoriasPermitidas.map((cat) => (
              <View key={cat} style={styles.chip}>
                <Text style={styles.chipText}>{CATEGORIA_LABELS[cat] ?? cat}</Text>
              </View>
            ))
          )}
        </View>

        <Text style={styles.hint}>
          Tu categoría define hasta qué nivel de subasta podés publicar: de lo tuyo a inferior.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default VendedorHomeScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  hello: { fontSize: 24, fontWeight: '700', color: W.text },
  subtitle: { fontSize: 14, color: W.textSub, marginTop: 2 },
  rotom: { width: 64, height: 64 },
  nivelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: W.card,
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  nivelLabel: { fontSize: 12, color: W.textSub },
  nivelValue: { fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: W.card,
    borderWidth: 1,
    borderColor: W.border,
    borderRadius: 14,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '800', color: W.accent },
  statLabel: { fontSize: 11, color: W.textSub, marginTop: 4 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: W.accent,
    borderRadius: 14,
    paddingVertical: spacing.base,
    marginBottom: spacing.xl,
  },
  ctaText: { fontSize: 15, fontWeight: '700', color: '#0A1626' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: W.text, marginBottom: spacing.md },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: W.border,
    backgroundColor: W.card,
    borderRadius: 999,
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
  },
  chipText: { fontSize: 12, color: W.text },
  emptyText: { fontSize: 13, color: W.textSub },
  hint: { fontSize: 12, color: W.textSub, marginTop: spacing.lg, lineHeight: 18 },
});
