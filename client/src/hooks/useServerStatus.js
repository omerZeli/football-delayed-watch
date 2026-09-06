import { useEffect, useRef, useState } from "react";
import { checkHealth } from "../lib/api.js";

// On Render's free plan the service sleeps after inactivity, and a cold start
// is never faster than ~20s. So after the first probe fails we don't bother
// re-checking before then, and afterwards we poll on a fixed interval until it
// answers.
const WAKE_INITIAL_DELAY_MS = 10_000;
const WAKE_POLL_INTERVAL_MS = 5_000;

/**
 * Tracks whether the Render server is awake so the UI can show a "waking up"
 * loader during cold starts.
 *
 * The loader shows by default from first render (status starts as "waking").
 * On mount the client probes /api/ping once. That request also nudges the
 * sleeping service to start:
 *   - responds quickly  -> status "awake", loader hides.
 *   - fails/times out    -> stays "waking"; we wait out the cold start and
 *                           poll until it answers, then flip to "awake".
 *
 * Status flow: "waking" -> "awake"
 *
 * Returns { status, isAwake }.
 */
export function useServerStatus() {
  // Default to "waking" so the loader is visible immediately, before the first
  // health check resolves. It hides only once the server is confirmed awake.
  const [status, setStatus] = useState("waking");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    (async () => {
      // First probe on load. This both detects the state and, if the service
      // is cold, kicks off its startup.
      const awake = await checkHealth();
      if (!mountedRef.current) return;
      if (awake) {
        setStatus("awake");
        return;
      }

      // Server is cold. The loader is already showing; poll until it's up. A
      // cold start is never quicker than the initial delay, so don't waste
      // checks before then.
      await new Promise((r) => setTimeout(r, WAKE_INITIAL_DELAY_MS));

      while (mountedRef.current) {
        const ok = await checkHealth({ timeoutMs: WAKE_POLL_INTERVAL_MS });
        if (!mountedRef.current) break;
        if (ok) {
          setStatus("awake");
          break;
        }
        await new Promise((r) => setTimeout(r, WAKE_POLL_INTERVAL_MS));
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { status, isAwake: status === "awake" };
}
