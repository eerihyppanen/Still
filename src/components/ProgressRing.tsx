import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Txt } from "./ui";
import { useTheme } from "../theme/ThemeProvider";
export function ProgressRing({
  completed,
  total,
  size = 120,
}: {
  completed: number;
  total: number;
  size?: number;
}) {
  const { colors } = useTheme();
  const progress = total ? completed / total : 0;
  const length = 2 * Math.PI * 50;
  return (
    <View
      accessible
      accessibilityLabel={`${completed} of ${total} ${total === 1 ? "habit" : "habits"} completed`}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Circle
          cx={60}
          cy={60}
          r={50}
          fill="none"
          stroke={colors.track}
          strokeWidth={9}
        />
        <Circle
          cx={60}
          cy={60}
          r={50}
          fill="none"
          stroke={colors.primary}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={length * (1 - progress)}
          transform="rotate(-90 60 60)"
        />
      </Svg>
      <Txt size={size < 120 ? 25 : 30} weight="700">
        {Math.round(progress * 100)}
        <Txt size={15} muted>
          %
        </Txt>
      </Txt>
    </View>
  );
}
