const ANIMEBYTES_BASE_URL = "https://animebytes.tv";
const ANIMEBYTES_USERNAME = import.meta.env.VITE_ANIMEBYTES_USERNAME;
const ANIMEBYTES_PASSKEY = import.meta.env.VITE_ANIMEBYTES_PASSKEY;

console.log("AnimeBytes API configured:", {
  baseUrl: ANIMEBYTES_BASE_URL,
  username: ANIMEBYTES_USERNAME ? "✓ Present" : "✗ Missing",
  passkey: ANIMEBYTES_PASSKEY ? "✓ Present" : "✗ Missing",
});

if (!ANIMEBYTES_USERNAME || !ANIMEBYTES_PASSKEY) {
  throw new Error(
    "AnimeBytes credentials not found. Please set VITE_ANIMEBYTES_USERNAME and VITE_ANIMEBYTES_PASSKEY environment variables.",
  );
}

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

// Interface to match the expected format used by TorrentSearch component
export interface TorrentSearchResult {
  title: string;
  indexer: string;
  publishDate?: string;
  size?: number;
  guid?: string;
  downloadUrl?: string;
  seeders?: number;
  leechers?: number;
  categories?: number[];
  // Additional fields that might be useful
  infoUrl?: string;
  magnetUrl?: string;
}

export async function searchTorrents(
  query: string,
  categories?: number[]
): Promise<TorrentSearchResult[]> {
  const searchParams = new URLSearchParams({
    username: ANIMEBYTES_USERNAME,
    torrent_pass: ANIMEBYTES_PASSKEY,
    type: "anime", // Default to anime, could be made configurable
    searchstr: query,
    limit: "50", // Max results per page
  });

  // Add freeleech preference if available
  searchParams.append("freeleech", "0");

  const url = `${ANIMEBYTES_BASE_URL}/scrape.php?${searchParams.toString()}`;

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

    // Transform AnimeBytes response to match expected interface
    const results: TorrentSearchResult[] = [];

    for (const group of data.Groups) {
      for (const torrent of group.Torrents) {
        // Skip pruned torrents
        if (torrent.Status !== 0) continue;

        const title = group.SeriesName
          ? `${group.SeriesName} - ${group.GroupName} (${group.Year})`
          : group.FullName.replace(/&nbsp;/g, " ");

        const result: TorrentSearchResult = {
          title: title,
          indexer: "AnimeBytes",
          publishDate: torrent.UploadTime,
          size: torrent.Size,
          guid: `animebytes-${torrent.ID}`,
          downloadUrl: torrent.Link.replace("{:passkey}", ANIMEBYTES_PASSKEY),
          seeders: torrent.Seeders,
          leechers: torrent.Leechers,
          infoUrl: `${ANIMEBYTES_BASE_URL}/torrents.php?id=${group.ID}&torrentid=${torrent.ID}`,
        };

        results.push(result);
      }
    }

    return results;
  } catch (error) {
    throw new Error(
      `Failed to search AnimeBytes: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Function to search for music specifically
export async function searchMusic(
  query: string,
  artistName?: string
): Promise<TorrentSearchResult[]> {
  const searchParams = new URLSearchParams({
    username: ANIMEBYTES_USERNAME,
    torrent_pass: ANIMEBYTES_PASSKEY,
    type: "music",
    groupname: query,
    limit: "50",
  });

  if (artistName) {
    searchParams.append("artistnames", artistName);
  }

  const url = `${ANIMEBYTES_BASE_URL}/scrape.php?${searchParams.toString()}`;

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

    const results: TorrentSearchResult[] = [];

    for (const group of data.Groups) {
      for (const torrent of group.Torrents) {
        if (torrent.Status !== 0) continue;

        const artistNames = group.Artists
          ? Object.values(group.Artists).map(artist => artist.name).join(", ")
          : "Various Artists";

        const title = `${artistNames} - ${group.GroupName} (${group.Year})`;

        const result: TorrentSearchResult = {
          title: title,
          indexer: "AnimeBytes",
          publishDate: torrent.UploadTime,
          size: torrent.Size,
          guid: `animebytes-music-${torrent.ID}`,
          downloadUrl: torrent.Link.replace("{:passkey}", ANIMEBYTES_PASSKEY),
          seeders: torrent.Seeders,
          leechers: torrent.Leechers,
          infoUrl: `${ANIMEBYTES_BASE_URL}/torrents2.php?id=${group.ID}&torrentid=${torrent.ID}`,
        };

        results.push(result);
      }
    }

    return results;
  } catch (error) {
    throw new Error(
      `Failed to search AnimeBytes music: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}