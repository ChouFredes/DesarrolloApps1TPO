import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { spacing, borderRadius, shadows } from '../theme';
import { ProfileStackParamList } from '../navigation/ProfileStackNavigator';

// ponytail: paleta navy local (igual a la home) sobreescribe el theme cálido, sin tocar styles
const colors = {
  primary: '#00EADF', accent: '#00EADF', background: '#0F1F35', surface: '#0D1E33',
  text: '#E1E1E1', textSecondary: 'rgba(225,225,225,0.5)', border: 'rgba(0,234,223,0.2)',
  success: '#7ED957', error: '#FF6B6B',
};

type Nav = StackNavigationProp<ProfileStackParamList, 'Configuracion'>;

// ─── Reusable row components ──────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  isLast?: boolean;
}

function ToggleRow({ icon, label, value, onToggle, isLast }: ToggleRowProps) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: 'rgba(225,225,225,0.2)', true: '#00EADF' }}
        thumbColor={'#E1E1E1'}
        ios_backgroundColor={'rgba(225,225,225,0.2)'}
      />
    </View>
  );
}

interface ActionRowProps {
  icon: React.ReactNode;
  label: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  showChevron?: boolean;
}

function ActionRow({ icon, label, rightElement, onPress, isLast, showChevron = true }: ActionRowProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[styles.row, !isLast && styles.rowBorder]}
      {...(onPress ? { onPress, activeOpacity: 0.7 } : {})}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
      {rightElement ? (
        <View style={styles.rightElement}>{rightElement}</View>
      ) : showChevron ? (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ) : null}
    </Wrapper>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ConfiguracionScreen() {
  const navigation = useNavigation<Nav>();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleNoOp = (label: string) => {
    Alert.alert(label, 'Esta función estará disponible próximamente.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sistema */}
        <Section title="SISTEMA">
          <ToggleRow
            icon={<Ionicons name="moon-outline" size={22} color={colors.accent} />}
            label="Modo oscuro"
            value={darkMode}
            onToggle={setDarkMode}
          />
          <ToggleRow
            icon={<Ionicons name="notifications-outline" size={22} color={colors.accent} />}
            label="Notificaciones"
            value={notifications}
            onToggle={setNotifications}
            isLast
          />
        </Section>

        {/* Ayuda */}
        <Section title="AYUDA">
          <ActionRow
            icon={<MaterialCommunityIcons name="bug-outline" size={22} color={colors.accent} />}
            label="Reportar un problema"
            onPress={() => handleNoOp('Reportar un problema')}
          />
          <ActionRow
            icon={<MaterialCommunityIcons name="headset" size={22} color={colors.accent} />}
            label="Ayuda"
            onPress={() => handleNoOp('Ayuda')}
            isLast
          />
        </Section>

        {/* Información */}
        <Section title="INFORMACIÓN">
          <ActionRow
            icon={<Ionicons name="help-circle-outline" size={22} color={colors.accent} />}
            label="FAQ"
            onPress={() => handleNoOp('FAQ')}
          />
          <ActionRow
            icon={<Ionicons name="information-circle-outline" size={22} color={colors.accent} />}
            label="Versión"
            showChevron={false}
            isLast
            rightElement={
              <Text style={styles.versionText}>1.0</Text>
            }
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ConfiguracionScreen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSide: {
    width: 40,
  },
  scrollContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 36,
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  rightElement: {
    alignItems: 'flex-end',
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
