import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useCallback } from "react";

export interface AppSettings {
  engineMode: "auto" | "local" | "force_llm";
  allowCustomPipeline: boolean;
  allowRepoContext: boolean;
  prMode: "auto_pr" | "plan_only";
  defaultRepoUrl?: string;
  branchPrefix: string;
  reduceMotion: boolean;
}

export const SETTINGS_DEFAULTS: AppSettings = {
  engineMode: "auto",
  allowCustomPipeline: true,
  allowRepoContext: true,
  prMode: "auto_pr",
  defaultRepoUrl: undefined,
  branchPrefix: "feat/",
  reduceMotion: false,
};

/**
 * Per-user application settings with defaults while loading or signed out.
 * `save` upserts the whole settings object (the Settings tab is the writer).
 */
export function useAppSettings() {
  const query = useQuery(api.settings.get);
  const update = useMutation(api.settings.update);

  const settings: AppSettings = query ?? SETTINGS_DEFAULTS;
  const loaded = query !== undefined;

  const save = useCallback(
    async (next: AppSettings) => {
      return update({
        engineMode: next.engineMode,
        allowCustomPipeline: next.allowCustomPipeline,
        allowRepoContext: next.allowRepoContext,
        prMode: next.prMode,
        defaultRepoUrl: next.defaultRepoUrl,
        branchPrefix: next.branchPrefix,
        reduceMotion: next.reduceMotion,
      });
    },
    [update],
  );

  return { settings, loaded, save };
}
