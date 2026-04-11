import { useEffect } from "react";

/**
 * Intercepts browser refresh, tab close, and navigation away
 * by showing the native "Leave site?" dialog when the game is active.
 *
 * @param active - Whether to block unload (true = game in progress)
 */
export function useBeforeUnload(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own generic message, setting returnValue
      // is still required for the dialog to appear in all browsers.
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
