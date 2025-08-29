import { createResource, Show, Suspense, For } from "solid-js";
import { useParams, A } from "@solidjs/router";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Chip,
} from "@suid/material";
import { ArrowBack, Download } from "@suid/icons-material";
import { getTVSeasonDetails } from "../api/tmdb";

export default function SeasonDetail() {
  const params = useParams();
  
  const [season] = createResource(
    () => ({ seriesId: params.id, seasonNumber: params.seasonNumber }),
    async ({ seriesId, seasonNumber }) => {
      if (!seriesId || !seasonNumber) return null;
      return await getTVSeasonDetails(parseInt(seriesId), parseInt(seasonNumber));
    }
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1, md: 2 } }}>
      <Box sx={{ 
        mb: 3, 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1, sm: 2 } 
      }}>
        <A href={`/show/${params.id}`}>
          <Button 
            startIcon={<ArrowBack />} 
            variant="outlined"
            sx={{ minHeight: "48px" }}
          >
            Back to Show
          </Button>
        </A>
        <A href={`/show/${params.id}/season/${params.seasonNumber}/torrents`}>
          <Button 
            startIcon={<Download />} 
            variant="contained" 
            color="primary"
            sx={{ minHeight: "48px" }}
          >
            Find Torrents
          </Button>
        </A>
      </Box>

      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        <Show when={season.error}>
          <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
            Error: {season.error?.message}
          </Typography>
        </Show>

        <Show when={season()}>
          {(seasonData) => (
            <Card>
              <CardContent>
                <Box sx={{ 
                  display: "flex", 
                  flexDirection: { xs: "column", md: "row" },
                  gap: { xs: 2, md: 4 }, 
                  mb: 4,
                  alignItems: { xs: "center", md: "flex-start" }
                }}>
                  <Show when={seasonData().poster_path}>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${seasonData().poster_path}`}
                      alt={seasonData().name}
                      style={{
                        width: "100%",
                        "max-width": "300px",
                        "border-radius": "8px",
                        "box-shadow": "0 4px 8px rgba(0,0,0,0.2)",
                        "flex-shrink": "0"
                      }}
                    />
                  </Show>
                  
                  <Box sx={{ 
                    flex: 1, 
                    minWidth: { xs: "100%", md: "300px" },
                    textAlign: { xs: "center", md: "left" }
                  }}>
                    <Typography 
                      variant="h3" 
                      component="h1" 
                      sx={{ 
                        mb: 2,
                        fontSize: { xs: "1.75rem", md: "3rem" }
                      }}
                    >
                      {seasonData().name}
                    </Typography>

                    <Box sx={{ 
                      mb: 3, 
                      display: "flex", 
                      gap: { xs: 1, sm: 2 }, 
                      flexWrap: "wrap",
                      justifyContent: { xs: "center", md: "flex-start" }
                    }}>
                      <Show when={seasonData().air_date}>
                        <Chip 
                          label={`Aired: ${seasonData().air_date}`} 
                          variant="outlined" 
                        />
                      </Show>
                      <Chip 
                        label={`${seasonData().episodes?.length || 0} Episodes`}
                        color="primary"
                      />
                      <Show when={seasonData().vote_average}>
                        <Chip 
                          label={`Rating: ${seasonData().vote_average?.toFixed(1)}/10`}
                          color={seasonData().vote_average! > 7 ? "success" : seasonData().vote_average! > 5 ? "primary" : "default"}
                        />
                      </Show>
                    </Box>

                    <Show when={seasonData().overview}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Overview
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {seasonData().overview}
                        </Typography>
                      </Box>
                    </Show>
                  </Box>
                </Box>

                <Show when={seasonData().episodes && seasonData().episodes!.length > 0}>
                  <Box>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: "1.5rem", md: "2.125rem" }
                      }}
                    >
                      Episodes
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <For each={seasonData().episodes}>
                        {(episode) => (
                          <Card variant="outlined">
                            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                              <Box sx={{ 
                                display: "flex", 
                                flexDirection: { xs: "column", sm: "row" },
                                gap: { xs: 2, sm: 3 }, 
                                alignItems: { xs: "center", sm: "flex-start" }
                              }}>
                                <Show when={episode.still_path}>
                                  <img
                                    src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
                                    alt={episode.name}
                                    style={{
                                      width: "100%",
                                      "max-width": "200px",
                                      height: "112px",
                                      "object-fit": "cover",
                                      "border-radius": "4px",
                                      "flex-shrink": "0"
                                    }}
                                  />
                                </Show>
                                <Box sx={{ 
                                  flex: 1,
                                  textAlign: { xs: "center", sm: "left" }
                                }}>
                                  <Typography variant="h6" sx={{ mb: 1 }}>
                                    {episode.episode_number}. {episode.name}
                                  </Typography>
                                  <Show when={episode.air_date}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                      Aired: {episode.air_date}
                                    </Typography>
                                  </Show>
                                  <Show when={episode.runtime}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                      Runtime: {episode.runtime} minutes
                                    </Typography>
                                  </Show>
                                  <Show when={episode.vote_average}>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                      Rating: {episode.vote_average?.toFixed(1)}/10
                                    </Typography>
                                  </Show>
                                  <Show when={episode.overview}>
                                    <Typography variant="body2">
                                      {episode.overview}
                                    </Typography>
                                  </Show>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </For>
                    </Box>
                  </Box>
                </Show>
              </CardContent>
            </Card>
          )}
        </Show>
      </Suspense>
    </Box>
  );
}