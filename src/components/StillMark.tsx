import { Image } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

const leaf = require("../../assets/splash-icon.png");

export function StillMark({ size }: { size: number }) {
  const { colors } = useTheme();
  return (
    <Image
      accessible={false}
      source={leaf}
      resizeMode="contain"
      style={{ width: size, height: size, tintColor: colors.primary }}
    />
  );
}
