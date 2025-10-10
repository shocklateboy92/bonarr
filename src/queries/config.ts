import { query } from "@solidjs/router";

export interface AppConfig {
  torrentFilterPath?: string;
}

export const getCurrentConfig = query((): AppConfig => {
  "use server";

  return {
    torrentFilterPath: process.env.TORRENT_FILTER_PATH,
  };
}, "get-current-config");
