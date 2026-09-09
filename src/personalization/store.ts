import { useSyncExternalStore } from "react";

/* Remembers which organization the reader picked, shared by every code
   block on every page and kept across visits in localStorage. */

const STORAGE_KEY = "ukc-personalization";

export interface PersonalizationState {
  orgUuid?: string;
}

const SERVER_SNAPSHOT: PersonalizationState = {};
const listeners = new Set<() => void>();

const read = (): PersonalizationState => {
  try {
    if (typeof localStorage === "undefined") return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    const { orgUuid } = parsed as Record<string, unknown>;
    return typeof orgUuid === "string" ? { orgUuid } : {};
  } catch {
    return {};
  }
};

let state: PersonalizationState = read();

const notify = () => {
  for (const listener of listeners) listener();
};

const write = (next: PersonalizationState) => {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Storage can be unavailable; the choice then lasts for the page. */
  }
  notify();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  /* Follow changes made in another tab. */
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      state = read();
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

export const setSelectedOrgUuid = (orgUuid: string) =>
  write({ ...state, orgUuid });

export const usePersonalizationState = (): PersonalizationState =>
  useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_SNAPSHOT,
  );
