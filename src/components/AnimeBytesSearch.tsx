import { createResource, createSignal, Show, For, createMemo } from "solid-js";
import { useParams, useSearchParams, A, useNavigate } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Chip,
  IconButton,
  InputAdornment,
  Avatar,
  Divider,
} from "@suid/material";
import toast, { Toaster } from "solid-toast";
import {
  ArrowBack,
  Search,
  Download,
  Clear,
  FileDownload,
  Info,
  ThumbUp,
  Category,
  CalendarToday,
  ImageNotSupported,
} from "@suid/icons-material";
import {
  searchAnimeBytes,
  type AnimeBytesGroup,
} from "../queries/animebytes-api";
import { transmissionClient } from "../api/transmission";
import { useCurrentConfig } from "../queries/config";
import { createScheduled, debounce } from "@solid-primitives/scheduled";
import ResourceDisplay from "./ResourceDisplay";

interface AnimeBytesSearchProps {
  mangaMode?: boolean;
}

export default function AnimeBytesSearch(props: AnimeBytesSearchProps) {
  const { mangaMode = false } = props;
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = createSignal(
    Array.isArray(searchParams.q)
      ? searchParams.q[0] || ""
      : searchParams.q || "",
  );

  // Create a debounced signal using solid-primitives
  const scheduled = createScheduled((fn) => debounce(fn, 500));

  const debouncedQuery = createMemo((prev: string = "") => {
    const currentQuery = query();
    // Trigger the scheduled update
    if (scheduled()) {
      // Update search params when debounced query changes
      if (currentQuery.trim()) {
        setSearchParams({ q: currentQuery });
      } else {
        setSearchParams({});
      }
      return currentQuery;
    }
    return prev;
  });

  const [searchResults] = createResource(
    () => debouncedQuery()?.trim(),
    (searchQuery) =>
      searchAnimeBytes({
        query: searchQuery,
        type: "anime",
        limit: 25,
        mangaOnly: mangaMode,
      }),
  );

  const [currentConfig] = useCurrentConfig();

  const handleSearch = () => {
    const searchTerm = query().trim();
    if (searchTerm) {
      setSearchParams({ q: searchTerm });
    }
  };

  const handleClear = () => {
    setQuery("");
    setSearchParams({});
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleDownload = async (downloadUrl: string, torrentName: string) => {
    try {
      const downloadDir = currentConfig()?.torrentFilterPath;
      if (!downloadDir) {
        toast.error(
          `Cannot add torrent "${torrentName}": Download directory is not configured. If you just loaded the page, please wait a moment and try again.`,
        );
        return;
      }

      const result = await transmissionClient.addTorrent(
        downloadUrl,
        downloadDir,
      );

      if (result.id) {
        toast.success(`Successfully added torrent: ${torrentName}`);
        if (mangaMode) {
          // For manga, navigate to volume torrent details
          navigate(`/volume/${params.id}/torrents/${result.id}`);
        } else {
          navigate(
            `/show/${params.id}/season/${params.seasonNumber}/torrents/${result.id}`,
          );
        }
      } else {
        toast(
          `Torrent "${torrentName}" may already exist or could not be added`,
          {
            icon: "⚠️",
          },
        );
      }
    } catch (error) {
      console.error("Failed to add torrent:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to add torrent "${torrentName}": ${errorMessage}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  const getTorrentProperty = (property: string) => {
    // Parse AnimeBytes property string like "Blu-ray | MKV | h264 | 1080p | FLAC 2.0 | Softsubs (PhyStein) | Freeleech"
    return property.split(" | ").map((p) => p.trim());
  };

  return (
    <>
      <Title>AnimeBytes Search | Bonarr</Title>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1, md: 2 } }}>
        <Box sx={{ mb: 3 }}>
          <A
            href={
              mangaMode
                ? `/volume/${params.id}`
                : `/show/${params.id}/season/${params.seasonNumber}`
            }
          >
            <Button startIcon={<ArrowBack />} variant="outlined">
              {mangaMode ? "Back to Volume" : "Back to Season"}
            </Button>
          </A>
        </Box>

        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontSize: { xs: "1.5rem", md: "2.125rem" },
          }}
        >
          {mangaMode
            ? "AnimeBytes Manga Search"
            : `AnimeBytes Search - Season ${params.seasonNumber}`}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {mangaMode
            ? "Search AnimeBytes directly for high-quality manga torrents"
            : "Search AnimeBytes directly for high-quality anime torrents"}
        </Typography>

        {/* Search Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label={
              mangaMode ? "Search AnimeBytes for Manga" : "Search AnimeBytes"
            }
            variant="outlined"
            value={query()}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Show when={query().trim()}>
                    <IconButton onClick={handleClear} edge="end">
                      <Clear />
                    </IconButton>
                  </Show>
                  <IconButton
                    onClick={handleSearch}
                    edge="end"
                    disabled={!query().trim()}
                    color="primary"
                  >
                    <Search />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Chip label="AnimeBytes" size="small" color="primary" />
            <Chip label="Direct Search" size="small" variant="outlined" />
            <Chip
              label={mangaMode ? "Manga Only" : "Groups & Series"}
              size="small"
              variant="outlined"
            />
            {mangaMode && (
              <Chip label="Printed Media" size="small" color="secondary" />
            )}
          </Box>
        </Box>

        <Show
          when={debouncedQuery().trim()}
          fallback={
            <Card>
              <CardContent>
                <Typography
                  sx={{ textAlign: "center", py: 4 }}
                  color="text.secondary"
                >
                  {mangaMode
                    ? "Enter a search term to find manga on AnimeBytes"
                    : "Enter a search term to find anime series on AnimeBytes"}
                </Typography>
              </CardContent>
            </Card>
          }
        >
          <ResourceDisplay resource={searchResults}>
            {(results) => (
              <>
                <Show when={results.length === 0}>
                  <Card>
                    <CardContent>
                      <Typography
                        sx={{ textAlign: "center", py: 4 }}
                        color="text.secondary"
                      >
                        {mangaMode
                          ? `No manga found on AnimeBytes for "${debouncedQuery()}". Try different search terms.`
                          : `No results found on AnimeBytes for "${debouncedQuery()}". Try different search terms.`}
                      </Typography>
                    </CardContent>
                  </Card>
                </Show>

                <Show when={results.length > 0}>
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Found {results.length} series/groups
                    </Typography>
                    <Chip
                      label={`Searching: "${debouncedQuery()}"`}
                      size="small"
                      variant="outlined"
                      onDelete={handleClear}
                    />
                  </Box>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <For each={results}>
                      {(group: AnimeBytesGroup) => (
                        <Card
                          sx={{
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                            },
                          }}
                        >
                          <CardContent sx={{ p: 0 }}>
                            {/* Group Header */}
                            <Box sx={{ p: 3, pb: 2 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 2,
                                  alignItems: "flex-start",
                                }}
                              >
                                {/* Cover Image */}
                                <Show
                                  when={group.Image}
                                  fallback={
                                    <Avatar
                                      sx={{
                                        width: 80,
                                        height: 120,
                                        borderRadius: 1,
                                      }}
                                    >
                                      <ImageNotSupported />
                                    </Avatar>
                                  }
                                >
                                  <Box
                                    component="img"
                                    src={group.Image}
                                    alt={group.SeriesName || group.GroupName}
                                    sx={{
                                      width: 80,
                                      height: 120,
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      flexShrink: 0,
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </Show>

                                {/* Group Info */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="h5"
                                    component="h2"
                                    sx={{ mb: 1, fontWeight: "bold" }}
                                  >
                                    {group.SeriesName || group.GroupName}
                                  </Typography>

                                  <Show
                                    when={
                                      group.SeriesName &&
                                      group.GroupName !== group.SeriesName
                                    }
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      color="text.secondary"
                                      sx={{ mb: 1 }}
                                    >
                                      {group.GroupName}
                                    </Typography>
                                  </Show>

                                  {/* Metadata chips */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      flexWrap: "wrap",
                                      mb: 2,
                                    }}
                                  >
                                    <Show when={group.Year}>
                                      <Chip
                                        icon={<CalendarToday />}
                                        label={group.Year}
                                        size="small"
                                        color="primary"
                                        sx={{ paddingLeft: "0.3em" }}
                                      />
                                    </Show>
                                    <Chip
                                      icon={<Category />}
                                      label={group.CategoryName}
                                      size="small"
                                      variant="outlined"
                                      sx={{ paddingLeft: "0.3em" }}
                                    />
                                    <Show when={group.EpCount}>
                                      <Chip
                                        label={`${group.EpCount} episodes`}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Show>
                                    <Show when={group.Ongoing}>
                                      <Chip
                                        label="Ongoing"
                                        size="small"
                                        color="warning"
                                      />
                                    </Show>
                                  </Box>

                                  {/* Stats */}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 3,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                      }}
                                    >
                                      <FileDownload
                                        fontSize="small"
                                        color="action"
                                      />
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {group.Snatched} snatches
                                      </Typography>
                                    </Box>
                                    <Show when={group.Comments > 0}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                        }}
                                      >
                                        <Info fontSize="small" color="action" />
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {group.Comments} comments
                                        </Typography>
                                      </Box>
                                    </Show>
                                    <Show when={group.Votes > 0}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                        }}
                                      >
                                        <ThumbUp
                                          fontSize="small"
                                          color="action"
                                        />
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {group.AvgVote}/10 ({group.Votes}{" "}
                                          votes)
                                        </Typography>
                                      </Box>
                                    </Show>
                                  </Box>

                                  {/* Alternative titles */}
                                  <Show when={group.SynonymnsV2}>
                                    <Box sx={{ mt: 2 }}>
                                      <Show when={group.SynonymnsV2?.Japanese}>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          <strong>Japanese:</strong>{" "}
                                          {group.SynonymnsV2?.Japanese}
                                        </Typography>
                                      </Show>
                                      <Show when={group.SynonymnsV2?.Romaji}>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          <strong>Romaji:</strong>{" "}
                                          {group.SynonymnsV2?.Romaji}
                                        </Typography>
                                      </Show>
                                    </Box>
                                  </Show>
                                </Box>
                              </Box>

                              {/* Tags */}
                              <Show
                                when={
                                  group.Tags?.filter((tag) => tag.trim())
                                    .length > 0
                                }
                              >
                                <Box
                                  sx={{
                                    mt: 2,
                                    display: "flex",
                                    gap: 1,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <For
                                    each={group.Tags.filter((tag) =>
                                      tag.trim(),
                                    )}
                                  >
                                    {(tag) => (
                                      <Chip
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: "0.7rem" }}
                                      />
                                    )}
                                  </For>
                                </Box>
                              </Show>
                            </Box>

                            <Divider />

                            {/* Torrents */}
                            <Box sx={{ p: 2 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  mb: 2,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Download />
                                Available Torrents (
                                {
                                  group.Torrents.filter((t) => t.Status === 0)
                                    .length
                                }
                                )
                              </Typography>

                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <For
                                  each={group.Torrents.filter(
                                    (torrent) => torrent.Status === 0,
                                  )}
                                >
                                  {(torrent) => (
                                    <Card
                                      variant="outlined"
                                      sx={{ backgroundColor: "action.hover" }}
                                    >
                                      <CardContent sx={{ p: 2 }}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            flexDirection: {
                                              xs: "column",
                                              sm: "row",
                                            },
                                            justifyContent: "space-between",
                                            alignItems: {
                                              xs: "stretch",
                                              sm: "flex-start",
                                            },
                                            gap: 2,
                                          }}
                                        >
                                          <Box sx={{ flex: 1 }}>
                                            <Typography
                                              variant="body1"
                                              sx={{
                                                fontWeight: "medium",
                                                mb: 1,
                                              }}
                                            >
                                              {torrent.EditionData
                                                ?.EditionTitle ||
                                                torrent.Property}
                                            </Typography>

                                            <Show
                                              when={
                                                torrent.EditionData
                                                  ?.EditionTitle &&
                                                torrent.Property !==
                                                  torrent.EditionData
                                                    ?.EditionTitle
                                              }
                                            >
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                  mb: 1,
                                                  fontStyle: "italic",
                                                }}
                                              >
                                                {torrent.Property}
                                              </Typography>
                                            </Show>

                                            <Box
                                              sx={{
                                                display: "flex",
                                                gap: 1,
                                                flexWrap: "wrap",
                                                mb: 1,
                                              }}
                                            >
                                              <For
                                                each={getTorrentProperty(
                                                  torrent.Property,
                                                )}
                                              >
                                                {(prop) => (
                                                  <Chip
                                                    label={prop}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{
                                                      fontSize: "0.7rem",
                                                    }}
                                                  />
                                                )}
                                              </For>
                                            </Box>

                                            <Box
                                              sx={{
                                                display: "flex",
                                                gap: 3,
                                                flexWrap: "wrap",
                                                mt: 1,
                                              }}
                                            >
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                              >
                                                Size:{" "}
                                                {formatFileSize(torrent.Size)}
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                color="success.main"
                                              >
                                                ↑ {torrent.Seeders} seeders
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                color="warning.main"
                                              >
                                                ↓ {torrent.Leechers} leechers
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                              >
                                                {torrent.Snatched} snatches
                                              </Typography>
                                              <Show when={torrent.UploadTime}>
                                                <Typography
                                                  variant="body2"
                                                  color="text.secondary"
                                                >
                                                  {formatDate(
                                                    torrent.UploadTime,
                                                  )}
                                                </Typography>
                                              </Show>
                                            </Box>
                                          </Box>

                                          <Button
                                            variant="contained"
                                            color="primary"
                                            startIcon={<Download />}
                                            onClick={() =>
                                              handleDownload(
                                                torrent.Link,
                                                `${
                                                  group.SeriesName ||
                                                  group.GroupName
                                                } - ${torrent.Property}`,
                                              )
                                            }
                                            size="small"
                                            sx={{
                                              minWidth: {
                                                xs: "auto",
                                                sm: "120px",
                                              },
                                              alignSelf: {
                                                xs: "stretch",
                                                sm: "flex-start",
                                              },
                                            }}
                                          >
                                            Add Torrent
                                          </Button>
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  )}
                                </For>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </For>
                  </Box>
                </Show>
              </>
            )}
          </ResourceDisplay>
        </Show>

        <Toaster />
      </Box>
    </>
  );
}
