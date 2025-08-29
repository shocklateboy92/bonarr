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
        include_adult: false,
      },
    },
  });

  if (error) {
    throw new Error(`Failed to search TV shows: ${error}`);
  }

  return data;
}

export { client };