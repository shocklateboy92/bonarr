import { query } from "@solidjs/router";
import { comicVineClient, ComicVineApiResponse, ComicVineSearchResult, ComicVineVolume, ComicVineIssue } from "../api/comicvine";

export interface SearchComicVineParams {
  query: string;
  limit?: number;
  page?: number;
}

export const searchComicVineVolumes = query(
  async (params: SearchComicVineParams): Promise<ComicVineApiResponse<ComicVineSearchResult>> => {
    "use server";

    const { query: searchQuery, limit = 10, page = 1 } = params;

    if (!searchQuery?.trim()) {
      return {
        error: "OK",
        limit: 0,
        offset: 0,
        number_of_page_results: 0,
        number_of_total_results: 0,
        status_code: 1,
        results: [],
      };
    }

    return await comicVineClient.searchVolumes(searchQuery, limit, page);
  },
  "search-comicvine-volumes",
);

export const getComicVineVolume = query(
  async (id: number): Promise<ComicVineVolume> => {
    "use server";

    const response = await comicVineClient.getVolume(id);
    if (!response.results || response.results.length === 0) {
      throw new Error(`Volume with ID ${id} not found`);
    }
    const volume = response.results[0];
    if (!volume) {
      throw new Error(`Volume with ID ${id} not found`);
    }
    return volume;
  },
  "get-comicvine-volume",
);

export const getVolumeIssues = query(
  async (volumeId: number): Promise<ComicVineIssue[]> => {
    "use server";

    const response = await comicVineClient.getIssuesForVolume(
      volumeId,
      "issue_number:asc",
      100,
      1,
      ["id", "name", "issue_number", "image", "cover_date", "store_date", "deck"]
    );
    return response.results;
  },
  "get-volume-issues",
);