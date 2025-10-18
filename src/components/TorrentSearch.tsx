import { createResource, createSignal, Show, Suspense, For } from "solid-js";
import { useParams, useSearchParams, A, useNavigate } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  TextField,
  Chip,
  IconButton,
  InputAdornment,
} from "@suid/material";
import toast, { Toaster } from "solid-toast";
import {
  ArrowBack,
  Search,
  Download,
  Clear,
  FileDownload,
  Info,
  Schedule,
} from "@suid/icons-material";
import { searchTorrents } from "../api/prowlarr";
import { transmissionClient } from "../api/transmission";
import { useCurrentConfig } from "../queries/config";

// TV categories for filtering (based on common torrent categories)
const TV_CATEGORIES = [5000, 5010, 5020, 5030, 5040, 5045, 5050, 5070, 5080]; // TV categories

export default function TorrentSearch() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = createSignal(
    Array.isArray(searchParams.q)
      ? searchParams.q[0] || ""
      : searchParams.q || "",
  );

  const [searchResults, { refetch }] = createResource(
    () => query()?.trim(),
    (searchQuery) => searchTorrents(searchQuery, TV_CATEGORIES),
  );

  const [currentConfig] = useCurrentConfig();

  const handleSearch = () => {
    const searchTerm = query().trim();
    if (searchTerm) {
      setSearchParams({ q: searchTerm });
      refetch();
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

  const handleDownload = async (magnetUrl: string, torrentName: string) => {
    try {
      const downloadDir = currentConfig()?.torrentFilterPath;
      if (!downloadDir) {
        toast.error(
          `Cannot add torrent "${torrentName}": Download directory is not configured. If you just loaded the page, please wait a moment and try again.`,
        );
      }

      const result = await transmissionClient.addTorrent(
        magnetUrl,
        downloadDir,
      );

      if (result.id) {
        // Successfully added, navigate to the torrent files page
        toast.success(`Successfully added torrent: ${torrentName}`);
        navigate(
          `/show/${params.id}/season/${params.seasonNumber}/torrents/${result.id}`,
        );
      } else {
        // Might be a duplicate or other issue
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

  return (
    <>
      <Title>Search Torrents | Bonarr</Title>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1, md: 2 } }}>
        <Box sx={{ mb: 3 }}>
          <A href={`/show/${params.id}/season/${params.seasonNumber}`}>
            <Button startIcon={<ArrowBack />} variant="outlined">
              Back to Season
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
          Find Torrents for Season {params.seasonNumber}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Search for torrents to download this season's episodes
        </Typography>

        {/* Search Input */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search for torrents"
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
            <Chip label="TV Shows Only" size="small" color="primary" />
            <Chip label="Prowlarr Search" size="small" variant="outlined" />
          </Box>
        </Box>

        <Suspense
          fallback={
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                my: 4,
                gap: 2,
              }}
            >
              <CircularProgress size={24} />
              <Typography>Searching torrents...</Typography>
            </Box>
          }
        >
          <Show when={searchResults.error}>
            <Card sx={{ mb: 2, backgroundColor: "error.light" }}>
              <CardContent>
                <Typography color="error" sx={{ textAlign: "center" }}>
                  Error searching torrents: {searchResults.error?.message}
                </Typography>
                <Typography variant="body2" sx={{ textAlign: "center", mt: 1 }}>
                  Make sure Prowlarr is running and accessible at the configured
                  URL.
                </Typography>
              </CardContent>
            </Card>
          </Show>

          <Show
            when={
              query().trim() &&
              searchResults()?.length === 0 &&
              !searchResults.loading
            }
          >
            <Card>
              <CardContent>
                <Typography
                  sx={{ textAlign: "center", py: 4 }}
                  color="text.secondary"
                >
                  No torrents found for "{query()}". Try adjusting your search
                  terms.
                </Typography>
              </CardContent>
            </Card>
          </Show>

          <Show when={searchResults() && searchResults()!.length > 0}>
            <Box
              sx={{
                mb: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Found {searchResults()!.length} results
              </Typography>
              <Chip
                label={`Searching: "${query()}"`}
                size="small"
                variant="outlined"
                onDelete={handleClear}
              />
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <For each={searchResults()}>
                {(result: any) => (
                  <Card
                    sx={{
                      transition: "all 0.2s ease-in-out",
                      "&:hover": {
                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {/* Header */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: "space-between",
                            alignItems: { xs: "flex-start", sm: "flex-start" },
                            gap: { xs: 2, sm: 0 },
                          }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              mr: { xs: 0, sm: 2 },
                              width: { xs: "100%", sm: "auto" },
                            }}
                          >
                            <Typography
                              variant="h6"
                              component="h2"
                              sx={{ mb: 1, lineHeight: 1.3 }}
                            >
                              {result.title}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 1,
                                flexWrap: "wrap",
                                mb: 1,
                              }}
                            >
                              <Show when={result.indexer}>
                                <Chip
                                  label={result.indexer}
                                  size="small"
                                  color="secondary"
                                />
                              </Show>
                              <Show when={result.publishDate}>
                                <Chip
                                  icon={<Schedule />}
                                  label={formatDate(result.publishDate)}
                                  size="small"
                                  variant="outlined"
                                />
                              </Show>
                            </Box>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: { xs: "row", sm: "column" },
                              gap: 1,
                              alignItems: { xs: "center", sm: "flex-end" },
                              justifyContent: {
                                xs: "space-between",
                                sm: "flex-start",
                              },
                              width: { xs: "100%", sm: "auto" },
                            }}
                          >
                            <Show when={result.size}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontWeight: "medium" }}
                              >
                                {formatFileSize(result.size)}
                              </Typography>
                            </Show>
                            <Button
                              variant="contained"
                              color="primary"
                              startIcon={<Download />}
                              onClick={() =>
                                handleDownload(
                                  result.magnetUrl || result.downloadUrl,
                                  result.title,
                                )
                              }
                              disabled={
                                !result.magnetUrl && !result.downloadUrl
                              }
                              size="small"
                            >
                              Add Torrent
                            </Button>
                          </Box>
                        </Box>

                        {/* Stats */}
                        <Box
                          sx={{
                            display: "flex",
                            gap: { xs: 2, sm: 4 },
                            flexWrap: "wrap",
                            justifyContent: { xs: "center", sm: "flex-start" },
                          }}
                        >
                          <Show when={result.seeders !== undefined}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="success.main"
                                sx={{ fontWeight: "medium" }}
                              >
                                ↑ {result.seeders}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: "0.75rem" }}
                              >
                                seeders
                              </Typography>
                            </Box>
                          </Show>

                          <Show when={result.leechers !== undefined}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="warning.main"
                                sx={{ fontWeight: "medium" }}
                              >
                                ↓ {result.leechers}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ fontSize: "0.75rem" }}
                              >
                                leechers
                              </Typography>
                            </Box>
                          </Show>

                          <Show
                            when={
                              result.grabs !== undefined && result.grabs > 0
                            }
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <FileDownload fontSize="small" color="action" />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {result.grabs} downloads
                              </Typography>
                            </Box>
                          </Show>
                        </Box>

                        {/* Categories */}
                        <Show
                          when={
                            result.categories && result.categories.length > 0
                          }
                        >
                          <Box
                            sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}
                          >
                            <For each={result.categories.slice(0, 3)}>
                              {(category: any) => (
                                <Chip
                                  label={
                                    category.name || `Category ${category.id}`
                                  }
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: "0.7rem" }}
                                />
                              )}
                            </For>
                            <Show when={result.categories.length > 3}>
                              <Chip
                                label={`+${result.categories.length - 3} more`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: "0.7rem" }}
                              />
                            </Show>
                          </Box>
                        </Show>

                        {/* Download URL for debugging */}
                        <Show when={!result.magnetUrl && !result.downloadUrl}>
                          <Box
                            sx={{
                              p: 1,
                              backgroundColor: "warning.light",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" color="warning.dark">
                              <Info fontSize="small" sx={{ mr: 1 }} />
                              No download link available for this torrent
                            </Typography>
                          </Box>
                        </Show>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </For>
            </Box>
          </Show>

          <Show when={!query().trim() && !searchResults.loading}>
            <Card>
              <CardContent>
                <Typography
                  sx={{ textAlign: "center", py: 4 }}
                  color="text.secondary"
                >
                  Enter a search term to find torrents
                </Typography>
              </CardContent>
            </Card>
          </Show>
        </Suspense>

        <Toaster />
      </Box>
    </>
  );
}
