import {
  createSignal,
  createResource,
  For,
  Show,
  Switch,
  Match,
  Suspense,
} from "solid-js";
import { Title } from "@solidjs/meta";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@suid/material";
import { A } from "@solidjs/router";
import { searchComicVineVolumes } from "../queries/comicvine-api";

export default function VolumeSearch() {
  const [searchQuery, setSearchQuery] = createSignal("");

  const [volumes, { refetch }] = createResource(
    () => searchQuery().trim(),
    async (q) => {
      if (!q) return null;
      return await searchComicVineVolumes({ query: q });
    },
  );

  return (
    <>
      <Title>Search Volumes | Bonarr</Title>
      <Box sx={{ maxWidth: 800, mx: "auto", p: { xs: 1, md: 2 } }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 2 },
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          label="Search Comic Volumes"
          variant="outlined"
          value={searchQuery()}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button
          variant="contained"
          onclick={refetch}
          disabled={!searchQuery().trim()}
          sx={{
            minWidth: { xs: "100%", sm: "auto" },
            minHeight: { xs: "48px", sm: "auto" },
          }}
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
          <Match when={volumes.error}>
            <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
              Error: {volumes.error?.message}
            </Typography>
          </Match>

          <Match when={!searchQuery()}>
            <Typography
              variant="body1"
              sx={{ textAlign: "center", my: 4, color: "text.secondary" }}
            >
              Enter a comic volume name to search
            </Typography>
          </Match>

          <Match when={volumes()?.results?.length === 0}>
            <Typography
              variant="body1"
              sx={{ textAlign: "center", my: 4, color: "text.secondary" }}
            >
              No volumes found for "{searchQuery()}"
            </Typography>
          </Match>

          <Match when={volumes()}>
            {(volumes) => (
              <>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Found {volumes().number_of_total_results} results
                </Typography>

                <For each={volumes().results}>
                  {(volume) => (
                    <A
                      href={`/volume/${volume.id}`}
                      style={{ "text-decoration": "none", color: "inherit" }}
                    >
                      <Card
                        sx={{
                          mb: 2,
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "column", sm: "row" },
                              gap: { xs: 2, sm: 2 },
                              alignItems: { xs: "center", sm: "flex-start" },
                            }}
                          >
                            <Show when={volume.image?.medium_url}>
                              <img
                                src={volume.image.medium_url}
                                alt={volume.name}
                                style={{
                                  width: "92px",
                                  height: "138px",
                                  "border-radius": "4px",
                                  "flex-shrink": "0",
                                  "object-fit": "cover",
                                }}
                              />
                            </Show>
                            <Box
                              sx={{
                                flex: 1,
                                textAlign: { xs: "center", sm: "left" },
                                width: { xs: "100%", sm: "auto" },
                              }}
                            >
                              <Typography variant="h6" component="h2">
                                {volume.name}
                              </Typography>
                              <Show when={volume.deck}>
                                <Typography
                                  variant="subtitle2"
                                  color="text.secondary"
                                >
                                  {volume.deck}
                                </Typography>
                              </Show>
                              <Show when={volume.description}>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {volume.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
                                </Typography>
                              </Show>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </A>
                  )}
                </For>
              </>
            )}
          </Match>
        </Switch>
      </Suspense>
      </Box>
    </>
  );
}