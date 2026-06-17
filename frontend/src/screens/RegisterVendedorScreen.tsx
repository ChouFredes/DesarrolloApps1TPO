import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { spacing } from '../theme';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { API_BASE_URL } from '../config/api';

type Nav = StackNavigationProp<AuthStackParamList, 'RegisterVendedor'>;

const W = {
  bg: '#0F1F35',
  surface: '#0A1626',
  card: '#0D1E33',
  input: '#152C44',
  text: '#E1E1E1',
  textSub: 'rgba(225,225,225,0.5)',
  accent: '#00EADF',
  border: 'rgba(0,234,223,0.2)',
  inactive: 'rgba(225,225,225,0.3)',
  error: '#FF6B6B',
};

export function RegisterVendedorScreen() {
  const navigation = useNavigation<Nav>();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [pais, setPais] = useState('');
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [fotoDataUrl, setFotoDataUrl] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getPaisId = (p: string): number => {
    const clean = p.trim().toLowerCase();
    if (clean.includes('japan') || clean.includes('japón') || clean.includes('japon')) return 2;
    if (clean.includes('spain') || clean.includes('españa') || clean.includes('espana')) return 3;
    if (clean.includes('brasil') || clean.includes('brazil')) return 4;
    if (clean.includes('francia') || clean.includes('france')) return 5;
    return 1; // Default Argentina
  };

  const pickFoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para adjuntar la foto.');
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
      setFotoUri(asset.uri);
      if (asset.base64) {
        setFotoDataUrl(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const handleRegister = async () => {
    if (!nombre || !apellido || !domicilio || !pais || !dni || !password) {
      setError('Completá todos los campos');
      return;
    }
    if (!fotoDataUrl) {
      setError('Adjuntá la foto que acredita tu categoría');
      return;
    }
    if (!accepted) {
      setError('Aceptá los términos y condiciones');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/auth/registro/vendedor`, {
        nombre,
        apellido,
        direccion: domicilio,
        paisId: getPaisId(pais),
        documento: dni,
        password,
        fotoAcreditacion: fotoDataUrl,
      });
      navigation.navigate('VendedorPending');
    } catch (e: any) {
      setError(
        e.response?.data?.detalle ||
          e.response?.data?.mensaje ||
          e.response?.data?.message ||
          'Error al registrarse'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Ionicons name="chevron-back" size={28} color={W.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Registro de vendedor</Text>
          <Text style={styles.subtitle}>
            Cargá tus datos y la foto que acredita tu categoría. Un administrador verificará tu cuenta.
          </Text>
          <View style={{ height: spacing.xl }} />
          <InputField label="Ingresá tu nombre" value={nombre} onChangeText={setNombre} />
          <InputField label="Ingresá tu apellido" value={apellido} onChangeText={setApellido} />
          <InputField label="Domicilio" value={domicilio} onChangeText={setDomicilio} />
          <InputField label="País" value={pais} onChangeText={setPais} />
          <InputField label="DNI" value={dni} onChangeText={setDni} keyboardType="numeric" />
          <InputField label="Contraseña" value={password} onChangeText={setPassword} isPassword />

          <Text style={styles.label}>Foto de acreditación de categoría</Text>
          <TouchableOpacity style={styles.fotoBox} onPress={pickFoto} activeOpacity={0.8}>
            {fotoUri ? (
              <>
                <Image source={{ uri: fotoUri }} style={styles.fotoPreview} resizeMode="cover" />
                <View style={styles.fotoEditBadge}>
                  <Ionicons name="camera" size={16} color="#0A1626" />
                </View>
              </>
            ) : (
              <View style={styles.fotoEmpty}>
                <Ionicons name="cloud-upload-outline" size={32} color={W.accent} />
                <Text style={styles.fotoEmptyText}>Tocá para subir la foto</Text>
                <Text style={styles.fotoEmptyHint}>
                  Certificado, credencial o comprobante de tu categoría de vendedor
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="Enviar registro" onPress={handleRegister} loading={loading} />
          <TouchableOpacity style={styles.termsRow} onPress={() => setAccepted(!accepted)}>
            <View style={[styles.checkbox, accepted && styles.checked]}>
              {accepted && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.termsText}>
              Al marcar esta opción, usted acepta los{' '}
              <Text style={styles.link}>términos</Text> y{' '}
              <Text style={styles.link}>condiciones</Text>.
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default RegisterVendedorScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: W.bg },
  container: { flexGrow: 1, padding: spacing.xl },
  back: { marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '700', color: W.text },
  subtitle: { fontSize: 14, color: W.textSub, marginTop: 4 },
  label: {
    color: W.textSub,
    fontSize: 14,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  fotoBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: W.border,
    backgroundColor: W.input,
    overflow: 'hidden',
    marginBottom: spacing.base,
  },
  fotoEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: 6,
  },
  fotoEmptyText: { color: W.text, fontSize: 14, fontWeight: '600' },
  fotoEmptyHint: { color: W.textSub, fontSize: 12, textAlign: 'center' },
  fotoPreview: { width: '100%', height: 180 },
  fotoEditBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#00EADF',
    borderRadius: 16,
    padding: 6,
  },
  error: { color: W.error, fontSize: 13, marginBottom: spacing.base },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.base, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 2,
    borderColor: '#00EADF', justifyContent: 'center', alignItems: 'center',
  },
  checked: { backgroundColor: '#00EADF' },
  termsText: { flex: 1, fontSize: 12, color: W.textSub },
  link: { color: '#00EADF' },
});
