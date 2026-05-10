export const colors = {
  primary: '#1A1A2E',
  accent: '#F5A623',
  background: '#F0F2F5',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#9E9E9E',
  border: '#E0E0E0',
  success: '#27AE60',
  error: '#E74C3C',
};

export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32,
};

export const borderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, full: 9999,
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '600' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
  price: { fontSize: 28, fontWeight: '700' as const, color: '#F5A623' },
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

// Legacy aliases so existing screens that import { Colors, Spacing, ... } keep working
export const Colors = colors;
export const Spacing = spacing;
export const Radius = borderRadius;

export const FontSizes = {
  h1: 24, h2: 20, h3: 18, body: 14, caption: 12, price: 28,
};

export const FontWeights = {
  regular: '400' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Typography = typography;

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};
