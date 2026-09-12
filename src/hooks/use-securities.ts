import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

/**
 * Ghost Securities © — live posture from the background protection engine.
 * Convex is reactive, so the tab updates itself the moment the cron or a
 * manual scan lands. Returns `null` while loading.
 */
export function useSecurities() {
  const posture = useQuery(api.securities.posture);
  const runScan = useMutation(api.securities.runScan);

  const scanNow = useCallback(async () => {
    return runScan({});
  }, [runScan]);

  return { posture: posture ?? null, scanNow };
}
