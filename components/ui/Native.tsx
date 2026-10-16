import { SymbolView } from 'expo-symbols';
import React from 'react';
import { ColorValue, Platform, PlatformColor, Pressable, StyleSheet, Text, TextProps, View } from 'react-native';

const color = (ios: string, fallback: string) => Platform.OS === 'ios' ? PlatformColor(ios) : fallback;
export const palette = {
  label: color('label', '#172027'), secondary: color('secondaryLabel', '#59636b'),
  fill: color('tertiarySystemFill', '#e8edf0'), separator: color('separator', '#d6dce0'),
  surface: color('secondarySystemGroupedBackground', '#ffffff'),
  background: color('systemGroupedBackground', '#f2f2f7'),
  tint: color('systemBlue', '#007aff'), green: color('systemGreen', '#248a3d'),
};

export function Icon({ name, size = 21, color = palette.label }: {
  name: React.ComponentProps<typeof SymbolView>['name']; size?: number; color?: ColorValue;
}) {
  return <SymbolView name={name} tintColor={color} weight="semibold" style={{ width: size, height: size }} />;
}

export function Label({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]} />;
}

export function IconButton({ name, label, onPress, disabled = false }: {
  name: React.ComponentProps<typeof SymbolView>['name']; label: string; onPress: () => void; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
    style={({ pressed }) => [styles.iconButton, { opacity: pressed || disabled ? 0.45 : 1 }]} onPress={onPress}>
    <Icon name={name} size={19} />
  </Pressable>;
}

export function Action({ title, symbol, onPress, secondary = false, disabled = false }: {
  title: string; symbol?: React.ComponentProps<typeof SymbolView>['name']; onPress: () => void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onPress}
    style={({ pressed }) => [styles.action, { backgroundColor: secondary ? palette.fill : palette.tint, opacity: pressed || disabled ? 0.5 : 1 }]}>
    {symbol && <Icon name={symbol} color={secondary ? palette.tint : 'white'} />}
    <Label style={{ color: secondary ? palette.tint : 'white', fontWeight: '600', textAlign: 'center', flexShrink: 1 }}>{title}</Label>
  </Pressable>;
}

export function Section({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return <View style={styles.section}>
    <Label accessibilityRole="header" style={styles.sectionTitle}>{title}</Label>
    {children}
  </View>;
}

export const styles = StyleSheet.create({
  body: { fontSize: 17, color: palette.label },
  caption: { fontSize: 13, color: palette.secondary },
  secondary: { fontSize: 15, color: palette.secondary },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.1, color: palette.label },
  section: { gap: 12, marginTop: 26 },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { backgroundColor: palette.surface, borderRadius: 20, borderCurve: 'continuous', overflow: 'hidden' },
  cardRow: { padding: 16, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: palette.separator, marginLeft: 16 },
  iconButton: { minWidth: 44, minHeight: 44, borderRadius: 24, backgroundColor: palette.fill, alignItems: 'center', justifyContent: 'center' },
  action: { minHeight: 52, borderRadius: 28, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
});
