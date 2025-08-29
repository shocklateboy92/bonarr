import { createResource, Show, Suspense, For, createSignal } from "solid-js";
import { useParams, A } from "@solidjs/router";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Chip,
  Alert,
} from "@suid/material";
import {
  ArrowBack,
  CheckCircle,
  Warning,
  Cancel,
  SwapHoriz,
} from "@suid/icons-material";
import { getTVSeasonDetails } from "../api/tmdb";
import {
  transmissionClient,
  TorrentWithFiles,
  TorrentFile,
} from "../api/transmission";
import FileSelectionModal from "./FileSelectionModal";

interface EpisodeMatch {
  episode: any;
  file: TorrentFile | null;
  confidence: "high" | "medium" | "low" | "none";
  fileIndex?: number;
}

export default function EpisodeTorrentMatcher() {
  const params = useParams();

  const [season] = createResource(
    () => ({ seriesId: params.id, seasonNumber: params.seasonNumber }),
    async ({ seriesId, seasonNumber }) => {
      if (!seriesId || !seasonNumber) return null;
      return await getTVSeasonDetails(
        parseInt(seriesId),
        parseInt(seasonNumber)
      );
    }
  );

  const [torrent] = createResource(
    () => params.torrentId,
    async (torrentId) => {
      if (!torrentId) return null;
      return await transmissionClient.getTorrentFiles(parseInt(torrentId));
    }
  );

  const [matches, setMatches] = createSignal<EpisodeMatch[]>([]);
  const [modalOpen, setModalOpen] = createSignal(false);
  const [selectedEpisode, setSelectedEpisode] = createSignal<any>(null);

  // Auto-matching logic
  const matchEpisodesWithFiles = (episodes: any[], files: TorrentFile[]) => {
    const videoFiles = files.filter((file) =>
      /\.(mkv|mp4|avi|m4v|mov|wmv|flv|webm|ts|m2ts)$/i.test(file.name)
    );

    return episodes.map((episode) => {
      const episodeNum = episode.episode_number;
      const seasonNum = parseInt(params.seasonNumber || "1");

      // Try different naming patterns
      const patterns = [
        new RegExp(`S0*${seasonNum}E0*${episodeNum}`, "i"),
        new RegExp(`Season.?0*${seasonNum}.?Episode.?0*${episodeNum}`, "i"),
        new RegExp(`${seasonNum}x0*${episodeNum}`, "i"),
        new RegExp(`Episode.?0*${episodeNum}`, "i"),
        new RegExp(`E0*${episodeNum}(?![0-9])`, "i"),
        new RegExp(`\\b0*${episodeNum}(?![0-9])`, "i"),
      ];

      let bestFile: TorrentFile | null = null;
      let bestConfidence: "high" | "medium" | "low" | "none" = "none";
      let bestIndex: number | undefined;

      videoFiles.forEach((file, index) => {
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          if (pattern && pattern.test(file.name)) {
            const confidence: "high" | "medium" | "low" =
              i < 3 ? "high" : i < 5 ? "medium" : "low";
            if (
              !bestFile ||
              (confidence === "high" && bestConfidence !== "high") ||
              (confidence === "medium" && bestConfidence === "low")
            ) {
              bestFile = file;
              bestConfidence = confidence;
              bestIndex = index;
            }
            break;
          }
        }
      });

      return {
        episode,
        file: bestFile,
        confidence: bestConfidence,
        fileIndex: bestIndex,
      };
    });
  };

  // Update matches when both season and torrent data are loaded
  const updateMatches = () => {
    const seasonData = season();
    const torrentData = torrent();

    if (seasonData?.episodes && torrentData?.files) {
      const newMatches = matchEpisodesWithFiles(
        seasonData.episodes,
        torrentData.files
      );
      setMatches(newMatches);
    }
  };

  // Watch for data changes
  createResource(() => [season(), torrent()], updateMatches);

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <CheckCircle color={getConfidenceColor(confidence)} />;
      case "medium":
        return <Warning color={getConfidenceColor(confidence)} />;
      case "low":
        return <Warning color={getConfidenceColor(confidence)} />;
      default:
        return <Cancel color={getConfidenceColor(confidence)} />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "success";
      case "medium":
        return "warning";
      case "low":
        return "warning";
      default:
        return "error";
    }
  };

  const getMatchedCount = () => {
    return matches().filter((match) => match.file).length;
  };

  const getTotalCount = () => {
    return matches().length;
  };

  const handleChangeFile = (episode: any) => {
    setSelectedEpisode(episode);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedEpisode(null);
  };

  const handleFileSelect = (file: TorrentFile | null) => {
    const episode = selectedEpisode();
    if (!episode) return;

    const updatedMatches = matches().map((match) => {
      if (match.episode.episode_number === episode.episode_number) {
        return {
          ...match,
          file,
          confidence: (file ? 'medium' : 'none') as 'high' | 'medium' | 'low' | 'none',
          fileIndex: undefined, // Reset since this is manual selection
        };
      }
      return match;
    });
    
    setMatches(updatedMatches);
  };

  const getCurrentFileForEpisode = (episode: any): TorrentFile | null => {
    const match = matches().find(
      (m) => m.episode.episode_number === episode.episode_number
    );
    return match?.file || null;
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1, md: 2 } }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <A href={`/show/${params.id}/season/${params.seasonNumber}/torrents`}>
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            sx={{ minHeight: "48px" }}
          >
            Back to Torrents
          </Button>
        </A>
        <A href={`/show/${params.id}/season/${params.seasonNumber}`}>
          <Button variant="outlined" sx={{ minHeight: "48px" }}>
            Back to Season
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
        <Show when={season.error || torrent.error}>
          <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
            Error: {season.error?.message || torrent.error?.message}
          </Typography>
        </Show>

        <Show when={season() && torrent()}>
          <Box>
            <Box>
              {/* Context Header */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h4"
                  sx={{ mb: 1, fontSize: { xs: "1.5rem", md: "2.125rem" } }}
                >
                  Match Episodes to Files
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  Season {params.seasonNumber} • {getTotalCount()} Episodes
                </Typography>

                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Chip
                    label={`${getMatchedCount()} auto-matched`}
                    color={
                      getMatchedCount() === getTotalCount()
                        ? "success"
                        : "primary"
                    }
                    size="small"
                  />
                  <Show when={getTotalCount() - getMatchedCount() > 0}>
                    <Chip
                      label={`${
                        getTotalCount() - getMatchedCount()
                      } need attention`}
                      color="warning"
                      size="small"
                    />
                  </Show>
                </Box>

                <Show when={torrent()}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Torrent: {torrent()?.name}
                  </Typography>
                </Show>

                <Show when={getMatchedCount() < getTotalCount()}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Review the matches below. Episodes with low confidence or no
                    matches may need manual correction.
                  </Alert>
                </Show>
              </Box>

              {/* Episode Matches List */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <For each={matches()}>
                  {(match) => (
                    <Card
                      variant="outlined"
                      sx={{
                        border:
                          match.confidence === "none" ? "2px solid" : undefined,
                        borderColor:
                          match.confidence === "none"
                            ? "error.main"
                            : undefined,
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            gap: { xs: 2, sm: 3 },
                            alignItems: { xs: "center", sm: "flex-start" },
                          }}
                        >
                          {/* Episode Thumbnail */}
                          <Show when={match.episode.still_path}>
                            <img
                              src={`https://image.tmdb.org/t/p/w300${match.episode.still_path}`}
                              alt={match.episode.name}
                              style={{
                                width: "100%",
                                "max-width": "120px",
                                height: "68px",
                                "object-fit": "cover",
                                "border-radius": "4px",
                                "flex-shrink": "0",
                              }}
                            />
                          </Show>

                          {/* Episode Info */}
                          <Box
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              textAlign: { xs: "center", sm: "left" },
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                mb: 1,
                                fontSize: { xs: "1rem", sm: "1.25rem" },
                              }}
                            >
                              Episode {match.episode.episode_number}:{" "}
                              {match.episode.name}
                            </Typography>
                            <Show when={match.episode.air_date}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 1 }}
                              >
                                {match.episode.air_date}
                              </Typography>
                            </Show>

                            {/* Match Status */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                justifyContent: {
                                  xs: "center",
                                  sm: "flex-start",
                                },
                                mb: match.file ? 1 : 0,
                              }}
                            >
                              {getConfidenceIcon(match.confidence)}
                              <Show when={match.file}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: "medium",
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  {match.file?.name.split("/").pop()}
                                </Typography>
                              </Show>
                              <Show when={!match.file}>
                                <Typography
                                  variant="body2"
                                  color="error"
                                  sx={{ fontWeight: "medium" }}
                                >
                                  No match found
                                </Typography>
                              </Show>
                            </Box>

                            <Show when={match.file}>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                }}
                              >
                                <Chip
                                  label={`${match.confidence} confidence`}
                                  color={getConfidenceColor(match.confidence)}
                                  size="small"
                                />
                                <Chip
                                  label={transmissionClient.formatBytes(
                                    match.file?.length || 0
                                  )}
                                  variant="outlined"
                                  size="small"
                                />
                                <Show when={match.file?.name.includes("/")}>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {match.file?.name.substring(
                                      0,
                                      match.file.name.lastIndexOf("/")
                                    )}
                                  </Typography>
                                </Show>
                              </Box>
                            </Show>
                          </Box>

                          {/* Action Button */}
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                              minWidth: { xs: "100%", sm: "auto" },
                            }}
                          >
                            <Button
                              variant={match.file ? "outlined" : "contained"}
                              color={match.file ? "primary" : "error"}
                              size="small"
                              startIcon={match.file ? <SwapHoriz /> : undefined}
                              sx={{ minHeight: "36px" }}
                              onClick={() => handleChangeFile(match.episode)}
                            >
                              {match.file ? "Change File" : "Select File"}
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )}
                </For>
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  mt: 4,
                  display: "flex",
                  gap: 2,
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "center",
                }}
              >
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ minHeight: "48px" }}
                >
                  Review All Matches
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={getMatchedCount() === 0}
                  sx={{ minHeight: "48px" }}
                >
                  Apply Matches ({getMatchedCount()}/{getTotalCount()})
                </Button>
              </Box>
            </Box>
          </Box>
        </Show>
      </Suspense>

      {/* File Selection Modal */}
      <Show when={modalOpen() && selectedEpisode() && torrent()}>
        <FileSelectionModal
          open={modalOpen()}
          onClose={handleModalClose}
          episode={selectedEpisode()}
          files={torrent()?.files || []}
          currentFile={getCurrentFileForEpisode(selectedEpisode())}
          onFileSelect={handleFileSelect}
        />
      </Show>
    </Box>
  );
}
