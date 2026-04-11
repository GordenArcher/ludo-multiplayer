import type { GameConfig } from "../types/game";

const SESSION_KEY = "ludo_active_game";

/**
 * Saves the current game config to sessionStorage whenever it changes.
 * On page load, call `loadPersistedGame()` to check if a game was in progress.
 *
 * sessionStorage is used (not localStorage) so the data is scoped to the
 * current tab and automatically cleared when the tab is closed.
 */

export function saveGameToSession(config: GameConfig): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(config));
  } catch {
    // sessionStorage unavailable (private mode quota, etc.), fail silently
  }
}

export function loadPersistedGame(): GameConfig | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameConfig;
  } catch {
    return null;
  }
}

export function clearPersistedGame(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
