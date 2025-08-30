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
import { ArrowBack, Download, CheckCircle, Cancel, Folder, Search } from "@suid/icons-material";
import { getTVSeasonDetails, getTVShowDetails } from "../api/tmdb";
import { checkExistingFiles, ExistingEpisodeFile } from "../lib/applyMatches";

export default function SeasonDetail() {
  const params = useParams();

  // Helper function to get existing file for an episode
  const getExistingFileForEpisode = (episodeNumber: number): ExistingEpisodeFile | null => {
    const files = existingFiles();
    return files?.find(file => file.episode === episodeNumber) || null;
  };
  
  const [season] = createResource(
    () => ({ seriesId: params.id, seasonNumber: params.seasonNumber }),
    async ({ seriesId, seasonNumber }) => {
      if (!seriesId || !seasonNumber) return null;
      return await getTVSeasonDetails(parseInt(seriesId), parseInt(seasonNumber));
    }
  );

  const [show] = createResource(
    () => params.id,
    async (seriesId) => {
      if (!seriesId) return null;
      return await getTVShowDetails(parseInt(seriesId));
    }
  );

  const [existingFiles] = createResource(
    () => {
      const seasonData = season();
      const showData = show();
      if (!seasonData?.episodes || !showData?.name || !params.id || !params.seasonNumber) return null;
      
      return {
        showName: showData.name,
        showId: parseInt(params.id),
        seasonNumber: parseInt(params.seasonNumber),
        episodes: seasonData.episodes.map((ep) => ep.episode_number)
      };
    },
    async (params) => {
      if (!params) return null;
      return await checkExistingFiles(params);
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
        <Show when={show()}>
          {(showData) => (
            <A href={`/show/${params.id}/season/${params.seasonNumber}/search?q=${encodeURIComponent(showData().name || '')}`}>
              <Button 
                startIcon={<Search />} 
                variant="contained" 
                color="secondary"
                sx={{ minHeight: "48px" }}
              >
                Find Torrents
              </Button>
            </A>
          )}
        </Show>
        <A href={`/show/${params.id}/season/${params.seasonNumber}/torrents`}>
          <Button 
            startIcon={<Download />} 
            variant="contained" 
            color="primary"
            sx={{ minHeight: "48px" }}
          >
            Select Torrent
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
        <Show when={season.error || show.error || existingFiles.error}>
          <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
            Error: {season.error?.message || show.error?.message || existingFiles.error?.message}
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
                      
                      {/* Library Status Summary */}
                      <Show when={existingFiles()}>
                        {(() => {
                          const files = existingFiles()!;
                          const availableCount = files.filter(f => f.exists).length;
                          const totalCount = files.length;
                          const hasAll = availableCount === totalCount;
                          
                          return (
                            <Chip 
                              label={`${availableCount}/${totalCount} in Library`}
                              color={hasAll ? "success" : availableCount > 0 ? "warning" : "error"}
                              icon={hasAll ? <CheckCircle /> : <Folder />}
                            />
                          );
                        })()}
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
                                    <Typography variant="body2" sx={{ mb: 2 }}>
                                      {episode.overview}
                                    </Typography>
                                  </Show>
                                  
                                  {/* File Status */}
                                  <Show when={existingFiles()}>
                                    <Box sx={{ 
                                      mt: 2, 
                                      pt: 2, 
                                      borderTop: "1px solid", 
                                      borderColor: "divider",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      flexWrap: "wrap"
                                    }}>
                                      {(() => {
                                        const existingFile = getExistingFileForEpisode(episode.episode_number);
                                        return (
                                          <Show when={existingFile} fallback={
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                              <Cancel color="error" fontSize="small" />
                                              <Typography variant="caption" color="text.secondary">
                                                Checking file status...
                                              </Typography>
                                            </Box>
                                          }>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                                              {existingFile!.exists ? (
                                                <CheckCircle color="success" fontSize="small" />
                                              ) : (
                                                <Cancel color="error" fontSize="small" />
                                              )}
                                              <Typography 
                                                variant="caption" 
                                                color={existingFile!.exists ? "success.main" : "error.main"}
                                                sx={{ fontWeight: "medium" }}
                                              >
                                                {existingFile!.exists ? "Available in Library" : "Not in Library"}
                                              </Typography>
                                              <Show when={existingFile!.exists}>
                                                <Folder fontSize="small" color="action" />
                                              </Show>
                                            </Box>
                                            <Show when={existingFile!.exists}>
                                              <Typography variant="caption" color="text.secondary">
                                                {existingFile!.fileName}
                                              </Typography>
                                            </Show>
                                          </Show>
                                        );
                                      })()}
                                    </Box>
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