import { createResource, Show, Suspense, For, createMemo } from "solid-js";
import { A, useParams } from "@solidjs/router";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Chip,
  LinearProgress,
  Button,
} from "@suid/material";
import { 
  Download, 
  Upload, 
  PlayArrow, 
  Stop, 
  CheckCircle,
  Error as ErrorIcon,
  Schedule,
  ArrowBack 
} from "@suid/icons-material";
import { transmissionClient, Torrent } from "../api/transmission";

export default function TorrentsList() {
  const params = useParams();
  
  const [torrents, { refetch }] = createResource(
    async () => {
      return await transmissionClient.getTorrents();
    }
  );

  const filterPath = import.meta.env.VITE_TORRENT_FILTER_PATH;
  
  const filteredTorrents = createMemo(() => {
    const allTorrents = torrents();
    if (!allTorrents || !filterPath) return allTorrents;
    
    return allTorrents.filter((torrent: Torrent) => {
      return torrent.downloadDir.startsWith(filterPath);
    });
  });

  const getStatusIcon = (status: number) => {
    switch (status) {
      case 0: return <Stop />;
      case 1: return <Schedule />;
      case 2: return <Schedule />;
      case 3: return <Schedule />;
      case 4: return <Download />;
      case 5: return <Schedule />;
      case 6: return <Upload />;
      default: return <ErrorIcon />;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "default";
      case 1: return "warning";
      case 2: return "info"; 
      case 3: return "warning";
      case 4: return "primary";
      case 5: return "warning";
      case 6: return "success";
      default: return "error";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };


  return (
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
          fontSize: { xs: "1.5rem", md: "2.125rem" }
        }}
      >
        Select Torrent for Season {params.seasonNumber}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Choose a torrent to download this season's episodes
      </Typography>

      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        <Show when={torrents.error}>
          <Card sx={{ mb: 2, backgroundColor: "error.light" }}>
            <CardContent>
              <Typography color="error" sx={{ textAlign: "center" }}>
                Error connecting to Transmission: {torrents.error?.message}
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "center", mt: 1 }}>
                Make sure Transmission is running and accessible at the configured URL.
              </Typography>
            </CardContent>
          </Card>
        </Show>

        <Show when={filteredTorrents() && filteredTorrents()!.length === 0}>
          <Card>
            <CardContent>
              <Typography sx={{ textAlign: "center", py: 4 }} color="text.secondary">
                No torrents found in the configured path ({filterPath || 'not configured'}). 
                {filterPath ? 'Add torrents to this location or check your VITE_TORRENT_FILTER_PATH setting.' : 'Configure VITE_TORRENT_FILTER_PATH in your .env file.'}
              </Typography>
            </CardContent>
          </Card>
        </Show>

        <Show when={filteredTorrents() && filteredTorrents()!.length > 0}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <For each={filteredTorrents()}>
              {(torrent: Torrent) => (
                <A 
                  href={`/show/${params.id}/season/${params.seasonNumber}/torrents/${torrent.id}`}
                  style={{ "text-decoration": "none", color: "inherit" }}
                >
                  <Card sx={{ 
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                      transform: "translateY(-2px)"
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {/* Header */}
                      <Box sx={{ 
                        display: "flex", 
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between", 
                        alignItems: { xs: "flex-start", sm: "flex-start" },
                        gap: { xs: 1, sm: 0 }
                      }}>
                        <Box sx={{ 
                          flex: 1, 
                          mr: { xs: 0, sm: 2 },
                          width: { xs: "100%", sm: "auto" }
                        }}>
                          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                            {torrent.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Added: {formatDate(torrent.addedDate)}
                          </Typography>
                        </Box>
                        <Box sx={{ 
                          display: "flex", 
                          gap: 1, 
                          alignItems: "center",
                          justifyContent: { xs: "flex-start", sm: "flex-end" }
                        }}>
                          <Chip
                            icon={getStatusIcon(torrent.status)}
                            label={transmissionClient.getStatusLabel(torrent.status)}
                            color={getStatusColor(torrent.status) as any}
                            size="small"
                          />
                        </Box>
                      </Box>

                      {/* Progress */}
                      <Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                          <Typography variant="body2">
                            {(torrent.percentDone * 100).toFixed(1)}% complete
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {transmissionClient.formatBytes(torrent.downloadedEver)} / {transmissionClient.formatBytes(torrent.totalSize)}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={torrent.percentDone * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      {/* Stats */}
                      <Box sx={{ 
                        display: "flex", 
                        gap: { xs: 2, sm: 4 }, 
                        flexWrap: "wrap",
                        justifyContent: { xs: "center", sm: "flex-start" }
                      }}>
                        <Show when={torrent.rateDownload > 0}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Download fontSize="small" color="primary" />
                            <Typography variant="body2">
                              {transmissionClient.formatSpeed(torrent.rateDownload)}
                            </Typography>
                          </Box>
                        </Show>

                        <Show when={torrent.rateUpload > 0}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Upload fontSize="small" color="success" />
                            <Typography variant="body2">
                              {transmissionClient.formatSpeed(torrent.rateUpload)}
                            </Typography>
                          </Box>
                        </Show>

                        <Show when={torrent.peersConnected > 0}>
                          <Typography variant="body2" color="text.secondary">
                            Peers: {torrent.peersConnected}
                          </Typography>
                        </Show>

                        <Show when={torrent.eta > 0 && torrent.status === 4}>
                          <Typography variant="body2" color="text.secondary">
                            ETA: {transmissionClient.formatETA(torrent.eta)}
                          </Typography>
                        </Show>

                        <Show when={torrent.uploadedEver > 0}>
                          <Typography variant="body2" color="text.secondary">
                            Ratio: {(torrent.uploadedEver / torrent.downloadedEver || 0).toFixed(2)}
                          </Typography>
                        </Show>
                      </Box>

                      {/* Error message */}
                      <Show when={torrent.error !== 0 && torrent.errorString}>
                        <Box sx={{ p: 1, backgroundColor: "error.light", borderRadius: 1 }}>
                          <Typography variant="body2" color="error">
                            Error: {torrent.errorString}
                          </Typography>
                        </Box>
                      </Show>

                      {/* Download location */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          fontFamily: 'monospace', 
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          wordBreak: 'break-all'
                        }}
                      >
                        📁 {torrent.downloadDir}
                      </Typography>
                    </Box>
                    </CardContent>
                  </Card>
                </A>
              )}
            </For>
          </Box>
        </Show>
      </Suspense>
    </Box>
  );
}