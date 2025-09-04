const COMIC_VINE_API_KEY = import.meta.env.VITE_COMIC_VINE_API_KEY;
const COMIC_VINE_BASE_URL = "https://comicvine.gamespot.com/api";

if (!COMIC_VINE_API_KEY) {
  throw new Error("Comic Vine API key not found. Set VITE_COMIC_VINE_API_KEY environment variable.");
}

export interface ComicVineImage {
  icon_url: string;
  medium_url: string;
  screen_url: string;
  screen_large_url: string;
  small_url: string;
  super_url: string;
  thumb_url: string;
  tiny_url: string;
  original_url: string;
}

export interface ComicVinePublisher {
  api_detail_url: string;
  id: number;
  name: string;
}

export interface ComicVineVolume {
  aliases: string;
  api_detail_url: string;
  count_of_issues: number;
  date_added: string;
  date_last_updated: string;
  deck: string;
  description: string;
  first_issue: {
    api_detail_url: string;
    id: number;
    name: string;
    issue_number: string;
  };
  id: number;
  image: ComicVineImage;
  last_issue: {
    api_detail_url: string;
    id: number;
    name: string;
    issue_number: string;
  };
  name: string;
  publisher: ComicVinePublisher;
  resource_type: "volume";
  site_detail_url: string;
  start_year: string;
}

export interface ComicVineIssue {
  aliases: string;
  api_detail_url: string;
  associated_images: ComicVineImage[];
  character_credits: Array<{
    api_detail_url: string;
    id: number;
    name: string;
  }>;
  cover_date: string;
  date_added: string;
  date_last_updated: string;
  deck: string;
  description: string;
  has_staff_review: boolean;
  id: number;
  image: ComicVineImage;
  issue_number: string;
  location_credits: Array<{
    api_detail_url: string;
    id: number;
    name: string;
  }>;
  name: string;
  person_credits: Array<{
    api_detail_url: string;
    id: number;
    name: string;
    role: string;
  }>;
  resource_type: "issue";
  site_detail_url: string;
  store_date: string;
  story_arc_credits: Array<{
    api_detail_url: string;
    id: number;
    name: string;
  }>;
  team_credits: Array<{
    api_detail_url: string;
    id: number;
    name: string;
  }>;
  volume: {
    api_detail_url: string;
    id: number;
    name: string;
  };
}

export interface ComicVineSearchResult {
  aliases: string;
  api_detail_url: string;
  deck: string;
  description: string;
  id: number;
  image: ComicVineImage;
  name: string;
  resource_type: "volume" | "issue" | "character" | "person" | "story_arc" | "team" | "location" | "concept" | "object" | "origin" | "power" | "publisher" | "series" | "movie" | "episode";
  site_detail_url: string;
}

export interface ComicVineApiResponse<T> {
  error: "OK" | string;
  limit: number;
  offset: number;
  number_of_page_results: number;
  number_of_total_results: number;
  status_code: number;
  results: T[];
}

interface ComicVineRequestParams {
  api_key?: string;
  format?: "json" | "xml" | "jsonp";
  field_list?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  filter?: string;
}

class ComicVineClient {
  private baseUrl: string = COMIC_VINE_BASE_URL;
  private apiKey: string | undefined = COMIC_VINE_API_KEY;

  private buildUrl(endpoint: string, params: ComicVineRequestParams = {}): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    const searchParams: ComicVineRequestParams = {
      api_key: this.apiKey,
      format: "json",
      ...params,
    };

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  private async makeRequest<T>(
    endpoint: string,
    params: ComicVineRequestParams = {}
  ): Promise<ComicVineApiResponse<T>> {
    if (!this.apiKey) {
      throw new Error("Comic Vine API key is required");
    }

    const url = this.buildUrl(endpoint, params);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ComicVineApiResponse<T> = await response.json();

      if (data.status_code === 100) {
        throw new Error("Invalid API Key");
      }

      if (data.error !== "OK") {
        throw new Error(`Comic Vine API error: ${data.error}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to communicate with Comic Vine API: ${error}`);
    }
  }

  async search(
    query: string,
    resources?: string[],
    limit: number = 10,
    page: number = 1
  ): Promise<ComicVineApiResponse<ComicVineSearchResult>> {
    const offset = (page - 1) * limit;
    const params: ComicVineRequestParams = {
      limit,
      offset,
    };

    if (resources && resources.length > 0) {
      params.filter = `resources:${resources.join(",")}`;
    }

    return this.makeRequest<ComicVineSearchResult>(
      `/search/?query=${encodeURIComponent(query)}`,
      params
    );
  }

  async searchVolumes(
    query: string,
    limit: number = 10,
    page: number = 1
  ): Promise<ComicVineApiResponse<ComicVineSearchResult>> {
    return this.search(query, ["volume"], limit, page);
  }

  async searchIssues(
    query: string,
    limit: number = 10,
    page: number = 1
  ): Promise<ComicVineApiResponse<ComicVineSearchResult>> {
    return this.search(query, ["issue"], limit, page);
  }

  async getVolume(
    id: number,
    fieldList?: string[]
  ): Promise<ComicVineApiResponse<ComicVineVolume>> {
    const params: ComicVineRequestParams = {};
    
    if (fieldList && fieldList.length > 0) {
      params.field_list = fieldList.join(",");
    }

    return this.makeRequest<ComicVineVolume>(`/volume/4000-${id}/`, params);
  }

  async getVolumes(
    filter?: string,
    sort?: string,
    limit: number = 10,
    page: number = 1,
    fieldList?: string[]
  ): Promise<ComicVineApiResponse<ComicVineVolume>> {
    const offset = (page - 1) * limit;
    const params: ComicVineRequestParams = {
      limit,
      offset,
    };

    if (filter) {
      params.filter = filter;
    }

    if (sort) {
      params.sort = sort;
    }

    if (fieldList && fieldList.length > 0) {
      params.field_list = fieldList.join(",");
    }

    return this.makeRequest<ComicVineVolume>("/volumes/", params);
  }

  async getIssue(
    id: number,
    fieldList?: string[]
  ): Promise<ComicVineApiResponse<ComicVineIssue>> {
    const params: ComicVineRequestParams = {};
    
    if (fieldList && fieldList.length > 0) {
      params.field_list = fieldList.join(",");
    }

    return this.makeRequest<ComicVineIssue>(`/issue/4000-${id}/`, params);
  }

  async getIssues(
    filter?: string,
    sort?: string,
    limit: number = 10,
    page: number = 1,
    fieldList?: string[]
  ): Promise<ComicVineApiResponse<ComicVineIssue>> {
    const offset = (page - 1) * limit;
    const params: ComicVineRequestParams = {
      limit,
      offset,
    };

    if (filter) {
      params.filter = filter;
    }

    if (sort) {
      params.sort = sort;
    }

    if (fieldList && fieldList.length > 0) {
      params.field_list = fieldList.join(",");
    }

    return this.makeRequest<ComicVineIssue>("/issues/", params);
  }

  async getIssuesForVolume(
    volumeId: number,
    sort?: string,
    limit: number = 100,
    page: number = 1,
    fieldList?: string[]
  ): Promise<ComicVineApiResponse<ComicVineIssue>> {
    return this.getIssues(
      `volume:${volumeId}`,
      sort || "issue_number:asc",
      limit,
      page,
      fieldList
    );
  }
}

export const comicVineClient = new ComicVineClient();