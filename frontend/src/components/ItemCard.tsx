import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  imageUrl?: string;
  creatorName: string;
  itemName: string;
  precioBase: string;
  onPress?: () => void;
  onJoin?: () => void;
  showJoinButton?: boolean;
  style?: ViewStyle;
}

export function ItemCard({ imageUrl, creatorName, itemName, precioBase, onPress, onJoin, showJoinButton, style }: Props) {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder} />
        )}
        <View style={styles.creatorBadge}>
          <View style={styles.creatorAvatar}>
            <Text style={styles.creatorInitial}>{creatorName[0]}</Text>
          </View>
          <Text style={styles.creatorName}>{creatorName}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.itemName} numberOfLines={1}>{itemName}</Text>
        <Text style={styles.priceLabel}>Precio base</Text>
        <Text style={styles.price}>{precioBase}</Text>
        {showJoinButton && (
          <PrimaryButton title="Unirte a la subasta" onPress={onJoin || (() => {})} style={styles.joinBtn} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default ItemCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 160, backgroundColor: colors.border },
  imagePlaceholder: { width: '100%', height: 160, backgroundColor: '#D0D0D0' },
  creatorBadge: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: borderRadius.full, paddingRight: 8,
  },
  creatorAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center',
    marginRight: 6,
  },
  creatorInitial: { color: '#fff', fontSize: 12, fontWeight: '700' },
  creatorName: { color: '#fff', fontSize: 12 },
  content: { padding: spacing.md },
  itemName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
  priceLabel: { fontSize: 12, color: colors.textSecondary },
  price: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  joinBtn: { marginTop: 4 },
});
