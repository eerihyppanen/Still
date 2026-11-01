import type { Snapshot } from "../domain/models";
import { buildWidgetSnapshot } from "./snapshot";
import TodayWidget from "./TodayWidget.android";

export function publishWidget(snapshot: Snapshot, today: string): void {
  TodayWidget.updateSnapshot(buildWidgetSnapshot(snapshot, today));
}
