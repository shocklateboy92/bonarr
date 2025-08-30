import createClient from "openapi-fetch";
import type { paths } from "../types/prowlarr";

const PROWLARR_BASE_URL =
  import.meta.env.VITE_PROWLARR_BASE_URL || "http://localhost:9696";
const PROWLARR_API_KEY = import.meta.env.VITE_PROWLARR_API_KEY;

console.log("Prowlarr API configured:", {
  baseUrl: PROWLARR_BASE_URL,
  apiKey: PROWLARR_API_KEY ? "✓ Present" : "✗ Missing",
});

if (!PROWLARR_API_KEY) {
  throw new Error(
    "Prowlarr API key not found. Please set VITE_PROWLARR_API_KEY environment variable."
  );
}

const client = createClient<paths>({
  baseUrl: PROWLARR_BASE_URL,
  headers: {
    "X-Api-Key": PROWLARR_API_KEY,
  },
});

export async function searchTorrents(query: string, categories?: number[]) {
  const { data, error } = await client.GET("/api/v1/search", {
    params: {
      query: {
        query,
        ...(categories && { categories }),
      },
    },
  });

  if (error) {
    throw new Error(
      `Failed to search torrents: ${JSON.stringify(error, null, 2)}`
    );
  }

  return data;
}

export { client };
