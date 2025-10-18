import { query } from "@solidjs/router";
import { createResource } from "solid-js";

export interface AppConfig {
  torrentFilterPath?: string;
}

const currentConfigQuery = query((): AppConfig => {
  "use server";

  return {
    torrentFilterPath: process.env.TORRENT_FILTER_PATH,
  };
}, "get-current-config");

export const useCurrentConfig = () => createResource(() => currentConfigQuery());
