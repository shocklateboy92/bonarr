import createClient from 'openapi-fetch';
import type { paths } from '../types/tmdb';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

if (!TMDB_API_KEY) {
  throw new Error('TMDB API key not found. Please set VITE_TMDB_API_KEY environment variable.');
}

const client = createClient<paths>({
  baseUrl: 'https://api.themoviedb.org',
  headers: {
    Authorization: `Bearer ${TMDB_API_KEY}`,
  },
});

export async function searchTVShows(query: string, page = 1) {
  const { data, error } = await client.GET('/3/search/tv', {
    params: {
      query: {
        query,
        page,
        include_adult: true,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to search TV shows: ${JSON.stringify(error, null, 2)}`);
  }

  return data;
}

export async function getTVShowDetails(id: number) {
  const { data, error } = await client.GET('/3/tv/{series_id}', {
    params: {
      path: { series_id: id },
    },
  });

  if (error) {
    throw new Error(`Failed to fetch TV show details: ${JSON.stringify(error, null, 2)}`);
  }

  return data;
}

export async function getTVSeasonDetails(seriesId: number, seasonNumber: number) {
  const { data, error } = await client.GET('/3/tv/{series_id}/season/{season_number}', {
    params: {
      path: { 
        series_id: seriesId,
        season_number: seasonNumber 
      },
    },
  });

  if (error) {
    throw new Error(`Failed to fetch TV season details: ${JSON.stringify(error, null, 2)}`);
  }

  return data;
}

export { client };