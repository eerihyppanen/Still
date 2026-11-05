import { Platform, Pressable, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";
import { Txt } from "./ui";

export function ChoiceControl<Value extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly { value: Value; label: string }[];
  value: Value;
  onChange: (value: Value) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        gap: 4,
        padding: 4,
        borderRadius: 16,
        backgroundColor: colors.tint,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled }}
            {...(Platform.OS === "web" ? { "aria-pressed": selected } : {})}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: selected ? colors.primary : "transparent",
              opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
            })}
          >
            <Txt
              size={15}
              weight="600"
              style={{
                textAlign: "center",
                color: selected ? colors.onPrimary : colors.primary,
              }}
            >
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
