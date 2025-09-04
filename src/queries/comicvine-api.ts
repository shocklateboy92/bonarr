import { query } from "@solidjs/router";
import { comicVineClient, ComicVineApiResponse, ComicVineSearchResult } from "../api/comicvine";

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