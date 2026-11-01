import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeProvider";

export function Txt({
  children,
  size = 16,
  weight = "400",
  muted,
  style,
  ...rest
}: React.ComponentProps<typeof Text> & {
  size?: number;
  weight?: TextStyle["fontWeight"];
  muted?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Text
      {...rest}
      style={[
        {
          color: muted ? colors.muted : colors.text,
          fontSize: size,
          fontWeight: weight,
          lineHeight: size * 1.4,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Screen({
  children,
  contentContainerStyle,
  scrollRef,
  scrollViewProps,
}: React.PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollRef?: React.Ref<React.ComponentRef<typeof ScrollView>>;
  scrollViewProps?: Omit<
    React.ComponentProps<typeof ScrollView>,
    "children" | "ref" | "contentContainerStyle"
  >;
}>) {
  const { colors } = useTheme();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        {...scrollViewProps}
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[s.screen, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export function FieldError({ message }: { message?: string }) {
  const { colors } = useTheme();
  return message ? (
    <Txt size={13} accessibilityRole="alert" style={{ color: colors.danger }}>
      {message}
    </Txt>
  ) : null;
}
export function Card({
  children,
  style,
}: React.PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const { colors } = useTheme();
  const color =
    variant === "primary"
      ? colors.onPrimary
      : variant === "danger"
        ? colors.danger
        : colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: variant === "primary" ? colors.primary : colors.tint,
          opacity: disabled || loading ? 0.5 : pressed ? 0.78 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color={color} />
      ) : null}
      <Txt weight="600" style={{ color, flexShrink: 1, textAlign: "center" }}>
        {title}
      </Txt>
    </Pressable>
  );
}
export function Heading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={s.heading}>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt size={32} weight="700" style={{ letterSpacing: -1 }}>
          {title}
        </Txt>
        {subtitle && <Txt muted>{subtitle}</Txt>}
      </View>
      {action}
    </View>
  );
}
export function Empty({
  icon = "leaf-outline",
  title,
  message,
  action,
}: {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Card style={s.empty}>
      <View style={[s.emptyIcon, { backgroundColor: colors.tint }]}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Txt size={22} weight="600" style={{ textAlign: "center" }}>
        {title}
      </Txt>
      <Txt muted style={{ textAlign: "center", maxWidth: 300 }}>
        {message}
      </Txt>
      {action}
    </Card>
  );
}
export function Section({ title, aside }: { title: string; aside?: string }) {
  return (
    <View style={[s.row, { marginTop: 6 }]}>
      <Txt size={20} weight="600">
        {title}
      </Txt>
      {aside && (
        <Txt size={14} muted>
          {aside}
        </Txt>
      )}
    </View>
  );
}
export const s = StyleSheet.create({
  screen: {
    padding: 24,
    gap: 22,
    paddingBottom: 40,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  card: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  button: {
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  empty: { alignItems: "center", paddingVertical: 36, gap: 14 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
});
