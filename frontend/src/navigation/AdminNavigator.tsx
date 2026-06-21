import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing } from '../theme';
import { useAuthStore } from '../stores/authStore';
import { AdminVendedoresScreen } from '../screens/AdminVendedoresScreen';
import { AdminUsuariosScreen } from '../screens/AdminUsuariosScreen';
import { AdminMediosPagoScreen } from '../screens/AdminMediosPagoScreen';
import { AdminSubastasScreen } from '../screens/AdminSubastasScreen';
import { AdminSubastaDetalleScreen } from '../screens/AdminSubastaDetalleScreen';
import { AdminArmarSubastaScreen } from '../screens/AdminArmarSubastaScreen';
import { AdminSubastasActivasScreen } from '../screens/AdminSubastasActivasScreen';
import { AdminSubastaCatalogoScreen } from '../screens/AdminSubastaCatalogoScreen';

const W = {
  bg: '#0F1F35', card: '#0D1E33', surface: '#0A1626', text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)', accent: '#00EADF', border: 'rgba(0,234,223,0.2)',
};

const ROTOM_IMG = require('../../assets/pokeballs/rotom.png');

// ─── Card de menú reutilizable ───────────────────────────────────────────────
function Hub({ rows }: { rows: { icon: string; label: string; hint?: string; onPress: () => void }[] }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.hubScroll}>
        {rows.map((r) => (
          <TouchableOpacity key={r.label} style={styles.row} activeOpacity={0.85} onPress={r.onPress}>
            <View style={styles.rowIcon}>
              <Ionicons name={r.icon as any} size={22} color={W.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{r.label}</Text>
              {r.hint ? <Text style={styles.rowHint}>{r.hint}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={W.textSub} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function AdminHome() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.homeScroll}>
        <View style={styles.homeHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Hola, {user?.nombre}</Text>
            <Text style={styles.subtitle}>Panel de la empresa</Text>
          </View>
          <Image source={ROTOM_IMG} style={styles.rotom} resizeMode="contain" />
        </View>
        <Hub
          rows={[
            { icon: 'cube-outline', label: 'Ítems por revisar', hint: 'Inspeccionar, tasar y asegurar', onPress: () => navigation.navigate('VendedorTab', { screen: 'AdminSubastas' }) },
            { icon: 'hammer-outline', label: 'Armar subasta', hint: 'Juntar ítems listos y ponerla en vivo', onPress: () => navigation.navigate('VendedorTab', { screen: 'AdminArmarSubasta' }) },
            { icon: 'briefcase-outline', label: 'Verificación de vendedores', hint: 'Aprobar nuevos vendedores', onPress: () => navigation.navigate('VendedorTab', { screen: 'AdminVendedores' }) },
            { icon: 'people-outline', label: 'Verificación de compradores', hint: 'Validar postores', onPress: () => navigation.navigate('CompradorTab', { screen: 'AdminUsuarios' }) },
            { icon: 'card-outline', label: 'Medios de pago', hint: 'Verificar medios pendientes', onPress: () => navigation.navigate('PerfilTab', { screen: 'AdminMediosPago' }) },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function VendedorHub() {
  const navigation = useNavigation<any>();
  return (
    <Hub
      rows={[
        { icon: 'cube-outline', label: 'Ítems por revisar', hint: 'Inspeccionar, tasar y asegurar', onPress: () => navigation.navigate('AdminSubastas') },
        { icon: 'hammer-outline', label: 'Armar subasta', hint: 'Juntar ítems listos y ponerla en vivo', onPress: () => navigation.navigate('AdminArmarSubasta') },
        { icon: 'briefcase-outline', label: 'Verificación de vendedores', hint: 'Aprobar nuevos vendedores', onPress: () => navigation.navigate('AdminVendedores') },
      ]}
    />
  );
}

function CompradorHub() {
  const navigation = useNavigation<any>();
  return (
    <Hub
      rows={[
        { icon: 'flame-outline', label: 'Subastas activas', hint: 'Las subastas en vivo ahora mismo', onPress: () => navigation.navigate('AdminSubastasActivas') },
        { icon: 'people-outline', label: 'Verificación de compradores', hint: 'Validar postores por DNI', onPress: () => navigation.navigate('AdminUsuarios') },
      ]}
    />
  );
}

function AdminPerfil() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.hubScroll}>
        <Text style={styles.hello}>{user?.nombre} {user?.apellido}</Text>
        <Text style={[styles.subtitle, { marginBottom: spacing.lg }]}>Empresa · administrador</Text>
        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => navigation.navigate('AdminMediosPago')}>
          <View style={styles.rowIcon}><Ionicons name="card-outline" size={22} color={W.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Medios de pago pendientes</Text>
            <Text style={styles.rowHint}>Verificar medios de vendedores y compradores</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={W.textSub} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { marginTop: spacing.lg }]} activeOpacity={0.85} onPress={logout}>
          <View style={styles.rowIcon}><Ionicons name="log-out-outline" size={22} color="#FF6B6B" /></View>
          <Text style={[styles.rowLabel, { color: '#FF6B6B', flex: 1 }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Stacks por tab ───────────────────────────────────────────────────────────
const Stack = createStackNavigator();
const stackOpts = { headerShown: false, gestureEnabled: true } as const;

function VendedorStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="VendedorHub" component={VendedorHub} />
      <Stack.Screen name="AdminSubastas" component={AdminSubastasScreen} />
      <Stack.Screen name="AdminSubastaDetalle" component={AdminSubastaDetalleScreen} />
      <Stack.Screen name="AdminArmarSubasta" component={AdminArmarSubastaScreen} />
      <Stack.Screen name="AdminVendedores" component={AdminVendedoresScreen} />
    </Stack.Navigator>
  );
}

function CompradorStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="CompradorHub" component={CompradorHub} />
      <Stack.Screen name="AdminSubastasActivas" component={AdminSubastasActivasScreen} />
      <Stack.Screen name="AdminSubastaCatalogo" component={AdminSubastaCatalogoScreen} />
      <Stack.Screen name="AdminUsuarios" component={AdminUsuariosScreen} />
    </Stack.Navigator>
  );
}

function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={stackOpts}>
      <Stack.Screen name="AdminPerfil" component={AdminPerfil} />
      <Stack.Screen name="AdminMediosPago" component={AdminMediosPagoScreen} />
    </Stack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A1626', borderTopWidth: 0.5, borderTopColor: 'rgba(0,234,223,0.12)',
          height: 60, paddingBottom: 8, paddingTop: 6,
        },
        tabBarActiveTintColor: '#00EADF',
        tabBarInactiveTintColor: 'rgba(225,225,225,0.35)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            HomeTab: { active: 'home', inactive: 'home-outline' },
            VendedorTab: { active: 'cube', inactive: 'cube-outline' },
            CompradorTab: { active: 'people', inactive: 'people-outline' },
            PerfilTab: { active: 'person', inactive: 'person-outline' },
          };
          const set = icons[route.name];
          const name = set ? (focused ? set.active : set.inactive) : 'ellipse-outline';
          return <Ionicons name={name as any} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={AdminHome} options={{ title: 'Home' }} />
      <Tab.Screen
        name="VendedorTab"
        component={VendedorStack}
        options={{ title: 'Vendedor' }}
        listeners={({ navigation }) => ({
          // navigate al screen raíz ya popea el stack anidado hasta su base
          tabPress: (e) => { e.preventDefault(); navigation.navigate('VendedorTab', { screen: 'VendedorHub' }); },
        })}
      />
      <Tab.Screen
        name="CompradorTab"
        component={CompradorStack}
        options={{ title: 'Comprador' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('CompradorTab', { screen: 'CompradorHub' }); },
        })}
      />
      <Tab.Screen
        name="PerfilTab"
        component={PerfilStack}
        options={{ title: 'Perfil' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => { e.preventDefault(); navigation.navigate('PerfilTab', { screen: 'AdminPerfil' }); },
        })}
      />
    </Tab.Navigator>
  );
}

export default AdminNavigator;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  hubScroll: { padding: spacing.base },
  homeScroll: { padding: spacing.base, paddingTop: spacing.lg },
  homeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  hello: { fontSize: 22, fontWeight: '800', color: W.text },
  subtitle: { fontSize: 14, color: W.textSub, marginTop: 2 },
  rotom: { width: 56, height: 56 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: W.card, borderWidth: 1, borderColor: W.border,
    borderRadius: 14, padding: spacing.base, marginBottom: spacing.md,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: W.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '700', color: W.text },
  rowHint: { fontSize: 12, color: W.textSub, marginTop: 2 },
});
