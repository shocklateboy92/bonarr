import {
  createSignal,
  createResource,
  For,
  Show,
  Switch,
  Match,
  Suspense,
} from "solid-js";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@suid/material";
import { searchTVShows } from "../api/tmdb";

export default function TVShowSearch() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const [tvShows, {refetch}] = createResource(
    () => searchQuery().trim(),
    async (q) => {
      if (!q) return null;
      return await searchTVShows(q);
    }
  );

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          label="Search TV Shows"
          variant="outlined"
          value={searchQuery()}
          onChange={e => setSearchQuery(e.target.value)}

        />
        <Button
          variant="contained"
          onclick={refetch}
          disabled={!searchQuery().trim()}
        >
          Search
        </Button>
      </Box>

      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        <Switch>
          <Match when={tvShows.error}>
            <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
              Error: {tvShows.error?.message}
            </Typography>
          </Match>

          <Match when={!searchQuery()}>
            <Typography
              variant="body1"
              sx={{ textAlign: "center", my: 4, color: "text.secondary" }}
            >
              Enter a TV show name to search
            </Typography>
          </Match>

          <Match when={tvShows()?.results?.length === 0}>
            <Typography
              variant="body1"
              sx={{ textAlign: "center", my: 4, color: "text.secondary" }}
            >
              No TV shows found for "{searchQuery()}"
            </Typography>
          </Match>

          <Match when={tvShows()}>
            {(tvShows) => (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Found {tvShows().total_results} results
                </Typography>

                <For each={tvShows().results}>
                  {(show) => (
                    <Card sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          <Show when={show.poster_path}>
                            <img
                              src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                              alt={show.name}
                              style={{
                                width: "92px",
                                height: "138px",
                                "border-radius": "4px",
                              }}
                            />
                          </Show>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" component="h2">
                              {show.name}
                            </Typography>
                            <Show when={show.first_air_date}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                First aired: {show.first_air_date}
                              </Typography>
                            </Show>
                            <Show when={show.vote_average}>
                              <Typography
                                variant="subtitle2"
                                color="text.secondary"
                              >
                                Rating: {show.vote_average?.toFixed(1)}/10
                              </Typography>
                            </Show>
                            <Show when={show.overview}>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {show.overview}
                              </Typography>
                            </Show>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </For>
              </>
            )}
          </Match>
        </Switch>
      </Suspense>
    </Box>
  );
}
