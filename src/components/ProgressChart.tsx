import { View } from "react-native";
import { Card, Txt } from "./ui";
import { useTheme } from "../theme/ThemeProvider";
export function ProgressChart({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle: string;
  points: {
    label: string;
    rate: number;
    completed: number;
    scheduled: number;
  }[];
}) {
  const { colors } = useTheme();
  return (
    <Card>
      <Txt size={20} weight="600">
        {title}
      </Txt>
      <Txt size={13} muted>
        {subtitle}
      </Txt>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          height: 154,
          alignItems: "flex-end",
          paddingTop: 8,
        }}
      >
        {points.map((point, index) => (
          <View
            key={index}
            accessible
            accessibilityLabel={`${point.label}, ${point.completed} of ${point.scheduled} complete, ${point.rate} percent`}
            style={{ flex: 1, alignItems: "center", height: "100%", gap: 7 }}
          >
            <Txt size={11} muted>
              {point.scheduled ? `${point.rate}%` : "–"}
            </Txt>
            <View
              style={{
                flex: 1,
                width: "100%",
                maxWidth: 40,
                backgroundColor: colors.track,
                borderRadius: 9,
                justifyContent: "flex-end",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: `${point.rate}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 9,
                }}
              />
            </View>
            <Txt size={12} muted>
              {point.label}
            </Txt>
          </View>
        ))}
      </View>
    </Card>
  );
}
