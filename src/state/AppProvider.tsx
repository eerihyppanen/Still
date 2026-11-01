import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import type { HabitRepository } from "../data/repository";
import { getRepository } from "../data/connection";
import { subscribeReminderActions } from "../notifications/response-handler";
import { publishWidget } from "../widgets/sync";
import { dateKey } from "../domain/dates";
import { saveCheckIn } from "../domain/check-in";
import { playCheckInFeedback } from "../feedback/check-in";
import type {
  AppSettings,
  DateKey,
  HabitDraft,
  Snapshot,
} from "../domain/models";
import { useTheme } from "../theme/ThemeProvider";
import {
  syncReminders,
  type NotificationStatus,
} from "../notifications/expo-reminders";

interface AppContextValue extends Snapshot {
  today: DateKey;
  loading: boolean;
  initialized: boolean;
  busy: boolean;
  error: string | null;
  notificationStatus: NotificationStatus;
  reload: () => Promise<void>;
  clearError: () => void;
  saveHabit: (draft: HabitDraft, id?: string) => Promise<string>;
  setCompletion: (
    id: string,
    date: DateKey,
    completed: boolean,
  ) => Promise<void>;
  setArchived: (id: string, archived: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  moveHabit: (id: string, direction: "up" | "down") => Promise<void>;
  reorderHabits: (ids: string[]) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
}
const AppContext = createContext<AppContextValue | null>(null);
const empty: Snapshot = {
  habits: [],
  completions: [],
  settings: { theme: "system", remindersEnabled: false, hapticsEnabled: false },
};
export function AppProvider({ children }: React.PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<Snapshot>(empty);
  const [today, setToday] = useState(dateKey());
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [notificationStatus, setNotificationStatus] =
    useState<NotificationStatus>({
      state: "off",
      message: "Reminders are off.",
    });
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(0);
  const { setMode } = useTheme();
  useEffect(() => {
    if (initialized) {
      try {
        publishWidget(snapshot, today);
      } catch {
        /* Tracking remains usable if the launcher cannot refresh its widget. */
      }
    }
  }, [snapshot, today, initialized]);
  const refresh = useCallback(async () => {
    const data = await (await getRepository()).snapshot();
    setSnapshot(data);
    setMode(data.settings.theme);
    setInitialized(true);
    setNotificationStatus(
      await syncReminders(
        data.habits,
        data.settings.remindersEnabled,
        dateKey(),
        data.completions,
      ),
    );
  }, [setMode]);
  const reload = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not open your habits. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [refresh]);
  useEffect(() => {
    let active = true;
    void getRepository()
      .then((repository) => repository.snapshot())
      .then(
        (data) => {
          if (active) {
            setSnapshot(data);
            setMode(data.settings.theme);
            setInitialized(true);
            setLoading(false);
            void syncReminders(
              data.habits,
              data.settings.remindersEnabled,
              dateKey(),
              data.completions,
            ).then((status) => {
              if (active) setNotificationStatus(status);
            });
          }
        },
        (e) => {
          if (active) {
            setError(
              e instanceof Error ? e.message : "Could not open your habits.",
            );
            setLoading(false);
          }
        },
      );
    return () => {
      active = false;
    };
  }, [setMode]);
  useEffect(
    () =>
      subscribeReminderActions(
        () => {
          void refresh().catch((e) => setError(String(e)));
        },
        (e) =>
          setError(
            e instanceof Error
              ? e.message
              : "The reminder action could not be saved. Try again.",
          ),
      ),
    [refresh],
  );
  useEffect(() => {
    const update = () => setToday(dateKey());
    const timer = setInterval(update, 15000);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        update();
        void refresh().catch((e) => setError(String(e)));
      }
    });
    return () => {
      clearInterval(timer);
      listener.remove();
    };
  }, [refresh]);
  async function mutate<T>(
    action: (repository: HabitRepository) => Promise<T>,
  ): Promise<T> {
    pending.current++;
    setBusy(true);
    setError(null);
    try {
      const result = await action(await getRepository());
      await refresh();
      return result;
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Your change could not be saved. Try again.",
      );
      throw e;
    } finally {
      pending.current--;
      setBusy(pending.current > 0);
    }
  }
  return (
    <AppContext.Provider
      value={{
        ...snapshot,
        today,
        loading,
        initialized,
        notificationStatus,
        busy,
        error,
        reload,
        clearError: () => setError(null),
        saveHabit: (draft, id) =>
          mutate((repo) => repo.saveHabit(draft, dateKey(), id)),
        setCompletion: (id, date, complete) =>
          saveCheckIn(
            () =>
              mutate((repo) =>
                repo.setCompletion(id, date, complete, dateKey()),
              ),
            playCheckInFeedback,
            snapshot.settings.hapticsEnabled,
            complete,
          ),
        setArchived: (id, archived) =>
          mutate((repo) => repo.setArchived(id, archived, dateKey())),
        deleteHabit: (id) => mutate((repo) => repo.deleteHabit(id)),
        moveHabit: (id, direction) =>
          mutate((repo) => repo.moveHabit(id, direction)),
        reorderHabits: (ids) => mutate((repo) => repo.reorderHabits(ids)),
        saveSettings: (settings) =>
          mutate((repo) => repo.saveSettings(settings)),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const state = useContext(AppContext);
  if (!state) throw new Error("AppProvider is missing");
  return state;
}
