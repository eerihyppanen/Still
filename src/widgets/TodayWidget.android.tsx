import { Button, Column, Text } from "@expo/ui/jetpack-compose";
import {
  background,
  cornerRadius,
  fillMaxSize,
  paddingAll,
} from "@expo/ui/jetpack-compose/modifiers";
import { createWidget, type WidgetEnvironment } from "expo-widgets";
import type { TodayWidgetSnapshot } from "./snapshot";

function TodayWidget(
  props: TodayWidgetSnapshot,
  environment: WidgetEnvironment,
) {
  "widget";
  const dark = environment.colorScheme === "dark";
  const text = dark ? "#F1EDFF" : "#26213C";
  return (
    <Column
      modifiers={[
        fillMaxSize(),
        background(dark ? "#211D30" : "#F7F7FC"),
        cornerRadius(20),
        paddingAll(16),
      ]}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold" }} color={text}>
        still · {props.dateLabel}
      </Text>
      <Text style={{ fontSize: 14 }} color={text}>
        {props.progress}
      </Text>
      {props.rows.map((row, index) => (
        <Text key={index} style={{ fontSize: 13 }} maxLines={1} color={text}>
          {row}
        </Text>
      ))}
      {props.more ? (
        <Text style={{ fontSize: 12 }} color={text}>
          {props.more}
        </Text>
      ) : null}
      <Text style={{ fontSize: 11 }} color={text}>
        Open Still to refresh this view
      </Text>
      <Button
        colors={{ containerColor: "#6B56BB", contentColor: "#FFFFFF" }}
        {...{ target: "open-still" }}
      >
        <Text>Open Still</Text>
      </Button>
    </Column>
  );
}
export default createWidget<TodayWidgetSnapshot>("StillToday", TodayWidget, {
  dateLabel: "Open to refresh",
  progress: "Your habits, on this device",
  rows: [],
  more: "",
});
