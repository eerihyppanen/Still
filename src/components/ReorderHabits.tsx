import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  AppState,
  PanResponder,
  Platform,
  ScrollView,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";
import { useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { Habit } from "../domain/models";
import { dragLayout, edgeScroll, moveToIndex } from "../domain/reorder";
import { useReducedMotion } from "../theme/useReducedMotion";
import { useTheme } from "../theme/ThemeProvider";
import { scheduleLabel } from "./HabitRow";
import { Txt } from "./ui";

export interface ReorderScrollMetrics {
  y: number;
  height: number;
  contentHeight: number;
}
type Projection = NonNullable<ReturnType<typeof dragLayout>>;
interface Drag {
  id: string;
  ids: string[];
  heights: Record<string, number>;
  startScroll: number;
  dy: number;
  pointer: number;
  top: number;
  bottom: number;
  layout: Projection;
  settling: boolean;
}

interface GripProps {
  habit: Habit;
  index: number;
  count: number;
  disabled: boolean;
  active: boolean;
  start: (event: GestureResponderEvent) => void;
  move: (dy: number, pointer: number) => void;
  finish: () => void;
  cancel: () => void;
  step: (direction: number) => void;
}
// Keep one responder for the whole touch sequence, while updating its callbacks after commits.
function createGripResponder(initial: GripProps) {
  let current = initial;
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => !current.disabled,
    onMoveShouldSetPanResponder: () => !current.disabled,
    onPanResponderGrant: (event) => current.start(event),
    onPanResponderMove: (event, gesture) =>
      current.move(gesture.dy, event.nativeEvent.pageY),
    onPanResponderRelease: () => current.finish(),
    onPanResponderTerminate: () => current.cancel(),
    onPanResponderTerminationRequest: () => false,
  });
  return {
    ...responder,
    update: (next: GripProps) => {
      current = next;
    },
  };
}
function Grip(props: GripProps) {
  const { colors } = useTheme();
  const [responder] = useState(() => createGripResponder(props));
  useLayoutEffect(() => {
    responder.update(props);
  });
  return (
    <View
      {...responder.panHandlers}
      accessible
      focusable
      accessibilityRole="adjustable"
      accessibilityLabel={`Reorder ${props.habit.name}`}
      accessibilityHint="Drag to move. Use move up or move down actions, or keyboard arrow keys."
      accessibilityState={{
        disabled: props.disabled,
        busy: props.disabled && !props.active,
      }}
      accessibilityValue={{
        min: 1,
        max: props.count,
        now: props.index + 1,
        text: `Position ${props.index + 1} of ${props.count}`,
      }}
      aria-valuemin={1}
      aria-valuemax={props.count}
      aria-valuenow={props.index + 1}
      aria-valuetext={`Position ${props.index + 1} of ${props.count}`}
      accessibilityActions={[
        ...(props.index > 0 ? [{ name: "decrement", label: "Move up" }] : []),
        ...(props.index < props.count - 1
          ? [{ name: "increment", label: "Move down" }]
          : []),
      ]}
      onAccessibilityAction={(event) => {
        if (
          !props.disabled &&
          ["decrement", "increment"].includes(event.nativeEvent.actionName)
        ) {
          props.step(event.nativeEvent.actionName === "decrement" ? -1 : 1);
        }
      }}
      onKeyDown={(event) => {
        if (event.nativeEvent.key === "Escape") {
          props.cancel();
          return;
        }
        if (
          !props.disabled &&
          ["ArrowUp", "ArrowDown"].includes(event.nativeEvent.key)
        ) {
          event.preventDefault();
          props.step(event.nativeEvent.key === "ArrowUp" ? -1 : 1);
        }
      }}
      style={[
        {
          width: 48,
          minHeight: 56,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: props.active ? colors.tint : "transparent",
        },
        Platform.OS === "web"
          ? ({
              touchAction: "none",
              cursor: props.active ? "grabbing" : "grab",
            } as unknown as ViewStyle)
          : undefined,
      ]}
    >
      <Ionicons
        name="reorder-three-outline"
        size={27}
        color={props.active ? colors.primary : colors.muted}
      />
    </View>
  );
}

export function ReorderHabits({
  habits,
  disabled,
  scrollRef,
  metrics,
  onInteractionChange,
  onReorder,
}: {
  habits: Habit[];
  disabled: boolean;
  scrollRef: React.RefObject<React.ComponentRef<typeof ScrollView> | null>;
  metrics: React.RefObject<ReorderScrollMetrics>;
  onInteractionChange: (active: boolean) => void;
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const { colors, dark } = useTheme();
  const reduced = useReducedMotion();
  const incomingIds = habits.map((h) => h.id);
  const incomingKey = incomingIds.join(":");
  const [preview, setPreview] = useState<{
    base: string;
    ids: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [slot, setSlot] = useState(0);
  const [messageHeight, setMessageHeight] = useState(42);
  const [message, setMessage] = useState(
    "Drag a grip to move a habit. Your order saves when you let go.",
  );
  const [error, setError] = useState(false);
  const ids =
    preview && (saving || preview.base === incomingKey)
      ? preview.ids
      : incomingIds;
  const displayKey = ids.join(":");
  const positions = new Map(
    (activeId ? moveToIndex(ids, activeId, slot) : ids).map((id, index) => [
      id,
      index,
    ]),
  );
  const byId = new Map(habits.map((habit) => [habit.id, habit]));
  const [motion] = useState(
    () => new Map(habits.map((h) => [h.id, new Animated.Value(0)])),
  );
  const heights = useRef<Record<string, number>>({});
  const drag = useRef<Drag | null>(null);
  const frame = useRef<number | null>(null);
  const locked = useRef(false);
  const mounted = useRef(true);
  const width = useRef(0);
  const cancelRef = useRef(() => {});
  const nativeDriver = Platform.OS !== "web";

  useLayoutEffect(() => {
    motion.forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });
  }, [displayKey, motion]);

  function stopFrame() {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  }
  function reset() {
    stopFrame();
    drag.current = null;
    motion.forEach((value) => {
      value.stopAnimation();
      value.setValue(0);
    });
  }
  function cancel() {
    if (!drag.current) return;
    reset();
    locked.current = false;
    setActiveId(null);
    setMessage("Move cancelled. Your saved order is unchanged.");
    onInteractionChange(false);
  }
  useLayoutEffect(() => {
    cancelRef.current = cancel;
  });
  useFocusEffect(useCallback(() => () => cancelRef.current(), []));
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener("change", (state) => {
      if (state !== "active") cancelRef.current();
    });
    return () => {
      mounted.current = false;
      listener.remove();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      motion.forEach((value) => value.stopAnimation());
      onInteractionChange(false);
    };
  }, [motion, onInteractionChange]);

  function paint(current: Drag) {
    const next = dragLayout(
      current.ids,
      current.heights,
      current.id,
      current.dy + metrics.current.y - current.startScroll,
    );
    if (!next) return;
    motion.get(current.id)?.setValue(next.dragOffset);
    if (next.index !== current.layout.index) {
      for (const id of current.ids) {
        if (id === current.id) continue;
        const value = motion.get(id)!;
        value.stopAnimation();
        if (reduced) value.setValue(next.offsets[id]!);
        else
          Animated.timing(value, {
            toValue: next.offsets[id]!,
            duration: 160,
            useNativeDriver: nativeDriver,
          }).start();
      }
      setSlot(next.index);
    }
    current.layout = next;
  }
  function start(id: string, event: GestureResponderEvent) {
    if (disabled || locked.current) return;
    const layout = dragLayout(ids, heights.current, id, 0);
    if (!layout) return;
    locked.current = true;
    const current: Drag = {
      id,
      ids: [...ids],
      heights: { ...heights.current },
      startScroll: metrics.current.y,
      dy: 0,
      pointer: event.nativeEvent.pageY,
      top: 0,
      bottom: 0,
      layout,
      settling: false,
    };
    drag.current = current;
    setError(false);
    setActiveId(id);
    setSlot(layout.index);
    setMessage("Move the habit, then let go to save.");
    onInteractionChange(true);
    scrollRef.current?.measureInWindow((_x, y, _w, h) => {
      if (drag.current === current) {
        current.top = y + 8;
        current.bottom = y + h - 8;
      }
    });
    let last = 0;
    const tick = (time: number) => {
      if (drag.current !== current) return;
      const elapsed = last ? time - last : 16;
      last = time;
      if (current.bottom > current.top) {
        const delta = edgeScroll(
          current.pointer,
          current.top,
          current.bottom,
          elapsed,
        );
        const nextY = Math.max(
          0,
          Math.min(
            metrics.current.contentHeight - metrics.current.height,
            metrics.current.y + delta,
          ),
        );
        if (delta && Math.abs(nextY - metrics.current.y) > 0.1) {
          metrics.current.y = nextY;
          scrollRef.current?.scrollTo({ y: nextY, animated: false });
          paint(current);
        }
      }
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }
  async function save(next: string[], movedId: string) {
    setPreview({ base: incomingKey, ids: next });
    setSaving(true);
    setActiveId(null);
    setMessage("Saving your order…");
    try {
      await onReorder(next);
      if (mounted.current)
        setMessage(
          `${byId.get(movedId)?.name ?? "Habit"} moved to position ${next.indexOf(movedId) + 1} of ${next.length}. Order saved.`,
        );
    } catch {
      if (mounted.current) {
        setPreview(null);
        setError(true);
        setMessage(
          "Your order couldn’t save. The saved order has been restored. Try again.",
        );
      }
    } finally {
      locked.current = false;
      if (mounted.current) {
        setSaving(false);
        onInteractionChange(false);
      }
    }
  }
  function finish() {
    const current = drag.current;
    if (!current || current.settling) return;
    stopFrame();
    if (current.layout.ids.join(":") === current.ids.join(":")) {
      cancel();
      return;
    }
    current.settling = true;
    const value = motion.get(current.id)!;
    Animated.timing(value, {
      toValue: current.layout.offsets[current.id]!,
      duration: reduced ? 0 : 140,
      useNativeDriver: nativeDriver,
    }).start(({ finished }) => {
      if (!finished || drag.current !== current || !mounted.current) return;
      drag.current = null;
      void save(current.layout.ids, current.id);
    });
  }
  function step(id: string, direction: number) {
    if (disabled || locked.current) return;
    const next = moveToIndex(ids, id, ids.indexOf(id) + direction);
    if (next.join(":") === displayKey) return;
    locked.current = true;
    setError(false);
    onInteractionChange(true);
    void save(next, id);
  }
  return (
    <View
      style={{ gap: 12 }}
      onLayout={(event) => {
        if (
          width.current &&
          Math.abs(width.current - event.nativeEvent.layout.width) > 1
        )
          cancel();
        width.current = event.nativeEvent.layout.width;
      }}
    >
      <View
        style={{ minHeight: messageHeight }}
        onLayout={(event) => {
          const height = event.nativeEvent.layout.height;
          if (height > messageHeight + 0.5) setMessageHeight(height);
        }}
      >
        <Txt
          size={14}
          muted={!error}
          accessibilityLiveRegion="polite"
          accessibilityRole={error ? "alert" : undefined}
          style={error ? { color: colors.danger } : undefined}
        >
          {message}
        </Txt>
      </View>
      <View style={{ gap: 12 }}>
        {ids.map((id) => {
          const habit = byId.get(id);
          if (!habit) return null;
          const index = positions.get(id)!;
          const active = activeId === id;
          return (
            <Animated.View
              key={id}
              onLayout={(event) => {
                const height = event.nativeEvent.layout.height;
                if (
                  drag.current &&
                  heights.current[id] &&
                  Math.abs(heights.current[id]! - height) > 1
                )
                  cancel();
                heights.current[id] = height;
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                paddingRight: 6,
                borderWidth: 1,
                borderRadius: 22,
                backgroundColor: colors.surface,
                borderColor: active ? colors.primary : colors.border,
                zIndex: active ? 10 : 0,
                boxShadow:
                  active && !reduced
                    ? `0px 6px 18px ${dark ? "#00000066" : "#30244926"}`
                    : undefined,
                transform: [
                  { translateY: motion.get(id)! },
                  { scale: active && !reduced ? 1.025 : 1 },
                ],
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: dark ? colors.tint : `${habit.color}14`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Txt size={25}>{habit.emoji}</Txt>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt weight="600">{habit.name}</Txt>
                <Txt muted size={13}>
                  {scheduleLabel(habit)}
                </Txt>
                <Txt
                  size={12}
                  style={{ color: active ? colors.primary : colors.muted }}
                >
                  {active ? slot + 1 : index + 1} of {ids.length}
                </Txt>
              </View>
              <Grip
                habit={habit}
                index={active ? slot : index}
                count={ids.length}
                disabled={disabled || saving || (!!activeId && !active)}
                active={active}
                start={(event) => start(id, event)}
                move={(dy, pointer) => {
                  const current = drag.current;
                  if (current && !current.settling) {
                    current.dy = dy;
                    current.pointer = pointer;
                    paint(current);
                  }
                }}
                finish={finish}
                cancel={cancel}
                step={(direction) => step(id, direction)}
              />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
