import { query } from "@solidjs/router";

// AnimeBytes API types based on their documentation
export interface AnimeBytesTorrent {
  ID: number;
  EditionData?: {
    EditionTitle?: string;
  };
  RawDownMultiplier: number;
  RawUpMultiplier: number;
  Link: string;
  Property: string;
  Snatched: number;
  Seeders: number;
  Leechers: number;
  Status: number;
  Size: number;
  FileCount: number;
  FileList?: Record<string, { filename: string; size: number }>;
  UploadTime: string;
}

export interface AnimeBytesGroup {
  ID: number;
  CategoryName: string;
  FullName: string;
  GroupName: string;
  SeriesID?: number;
  SeriesName?: string;
  Year?: string;
  Image?: string;
  SynonymnsV2?: {
    Japanese?: string;
    Romaji?: string;
    Alternative?: string;
  };
  Snatched: number;
  Comments: number;
  Links?: Record<string, string>;
  Votes: number;
  AvgVote: number;
  Description?: string;
  DescriptionHTML?: string;
  EpCount?: number;
  StudioList?: string;
  PastWeek: number;
  Incomplete?: boolean;
  Ongoing?: boolean;
  Tags: string[];
  Torrents: AnimeBytesTorrent[];
  // Music-specific fields
  Artists?: Record<string, { name: string; character?: Record<string, string> }>;
  Associations?: string;
}

export interface AnimeBytesSearchResponse {
  Results: number;
  Pagination: {
    Current: number;
    Max: number;
    Limit: {
      Min: number;
      Coerced: number;
      Max: number;
    };
  };
  Matches: number;
  Groups: AnimeBytesGroup[];
}

export interface SearchAnimeBytesParams {
  query: string;
  type?: "anime" | "music";
  limit?: number;
}

const makeError = (message: string) => {
  throw new Error(message);
};

const ANIMEBYTES_USERNAME =
  process.env.VITE_ANIMEBYTES_USERNAME ??
  makeError("VITE_ANIMEBYTES_USERNAME environment variable is not set");

const ANIMEBYTES_PASSKEY =
  process.env.VITE_ANIMEBYTES_PASSKEY ??
  makeError("VITE_ANIMEBYTES_PASSKEY environment variable is not set");

export const searchAnimeBytes = query(
  async (params: SearchAnimeBytesParams): Promise<AnimeBytesGroup[]> => {
    "use server";

    const { query: searchQuery, type = "anime", limit = 25 } = params;

    if (!searchQuery?.trim()) {
      return [];
    }

    const searchParams = new URLSearchParams({
      username: ANIMEBYTES_USERNAME,
      torrent_pass: ANIMEBYTES_PASSKEY,
      type,
      searchstr: searchQuery,
      limit: limit.toString(),
    });


    const url = `https://animebytes.tv/scrape.php?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Bonarr/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AnimeBytesSearchResponse = await response.json();

      // Replace passkey placeholders in download URLs
      const groups = data.Groups || [];
      for (const group of groups) {
        for (const torrent of group.Torrents) {
          torrent.Link = torrent.Link.replace("{:passkey}", ANIMEBYTES_PASSKEY);
        }
      }

      return groups;
    } catch (error) {
      console.error("AnimeBytes search error:", error);
      throw new Error(
        `Failed to search AnimeBytes: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
  "search-animebytes",
);
