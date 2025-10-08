import { Title } from "@solidjs/meta";
import { A, useParams } from "@solidjs/router";
import {
  ArrowBack,
  Cancel,
  CheckCircle,
  Folder,
  InsertDriveFile,
} from "@suid/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@suid/material";
import { createResource, For, Show, Suspense } from "solid-js";
import { transmissionClient } from "../api/transmission";

export default function TorrentFiles() {
  const params = useParams();

  const [torrent] = createResource(
    () => params.torrentId,
    async (torrentId) => {
      if (!torrentId) return null;
      return await transmissionClient.getTorrentFiles(parseInt(torrentId));
    },
  );

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getFileIcon = (filename: string) => {
    if (filename.includes("/")) {
      return <Folder color="primary" />;
    }
    return <InsertDriveFile />;
  };

  return (
    <>
      <Title>Torrent Files | Bonarr</Title>
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
          <A
            href={`/show/${params.id}/season/${params.seasonNumber}/torrents/${params.torrentId}/match`}
          >
            <Button
              variant="contained"
              color="primary"
              sx={{ minHeight: "48px" }}
            >
              Match Episodes
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
          <Show when={torrent.error}>
            <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
              Error: {torrent.error?.message}
            </Typography>
          </Show>

          <Show when={torrent()}>
            {(torrentData) => (
              <Box>
                {/* Context Header */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" color="text.secondary">
                    Season {params.seasonNumber} Torrent Files
                  </Typography>
                </Box>

                {/* Torrent Info Header */}
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography
                      variant="h4"
                      component="h1"
                      sx={{
                        mb: 2,
                        fontSize: { xs: "1.5rem", md: "2.125rem" },
                      }}
                    >
                      {torrentData().name}
                    </Typography>

                    <Box
                      sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}
                    >
                      <Chip
                        label={transmissionClient.getStatusLabel(
                          torrentData().status,
                        )}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`${(torrentData().percentDone * 100).toFixed(
                          1,
                        )}% complete`}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={transmissionClient.formatBytes(
                          torrentData().totalSize,
                        )}
                        variant="outlined"
                        size="small"
                      />
                      <Chip
                        label={`${torrentData().files?.length || 0} files`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={torrentData().percentDone * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      📁 {torrentData().downloadDir}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Added: {formatDate(torrentData().addedDate)}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Files List */}
                <Card>
                  <CardContent>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        mb: 2,
                        fontSize: { xs: "1.25rem", md: "1.5rem" },
                      }}
                    >
                      Files ({torrentData().files?.length || 0})
                    </Typography>

                    <Show
                      when={
                        !torrentData().files ||
                        torrentData().files!.length === 0
                      }
                    >
                      <Typography
                        sx={{ textAlign: "center", py: 4 }}
                        color="text.secondary"
                      >
                        No files information available for this torrent.
                      </Typography>
                    </Show>

                    <Show
                      when={
                        torrentData().files && torrentData().files!.length > 0
                      }
                    >
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ overflowX: "auto" }}
                      >
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>File</TableCell>
                              <TableCell align="right">Size</TableCell>
                              <TableCell align="right">Progress</TableCell>
                              <TableCell align="center">Wanted</TableCell>
                              <TableCell align="center">Priority</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <For each={torrentData().files}>
                              {(file, index) => {
                                const fileStats = torrentData().fileStats?.[
                                  index()
                                ] || {
                                  bytesCompleted: file.bytesCompleted,
                                  wanted: file.wanted,
                                  priority: file.priority,
                                };
                                const progress =
                                  file.length > 0
                                    ? (fileStats.bytesCompleted / file.length) *
                                      100
                                    : 0;
                                const fileName =
                                  file.name.split("/").pop() || file.name;
                                const directory = file.name.includes("/")
                                  ? file.name.substring(
                                      0,
                                      file.name.lastIndexOf("/"),
                                    )
                                  : "";

                                return (
                                  <TableRow>
                                    <TableCell>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        {getFileIcon(file.name)}
                                        <Box>
                                          <Typography
                                            variant="body2"
                                            sx={{ fontWeight: "medium" }}
                                          >
                                            {fileName}
                                          </Typography>
                                          <Show when={directory}>
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              {directory}
                                            </Typography>
                                          </Show>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2">
                                        {transmissionClient.formatBytes(
                                          file.length,
                                        )}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ minWidth: 120 }}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                          }}
                                        >
                                          <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                              flex: 1,
                                              height: 6,
                                              borderRadius: 3,
                                            }}
                                          />
                                          <Typography
                                            variant="caption"
                                            sx={{ minWidth: 35 }}
                                          >
                                            {progress.toFixed(0)}%
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                      {fileStats.wanted ? (
                                        <CheckCircle
                                          color="success"
                                          fontSize="small"
                                        />
                                      ) : (
                                        <Cancel
                                          color="disabled"
                                          fontSize="small"
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={
                                          fileStats.priority === 1
                                            ? "High"
                                            : fileStats.priority === 0
                                              ? "Normal"
                                              : fileStats.priority === -1
                                                ? "Low"
                                                : "Normal"
                                        }
                                        size="small"
                                        color={
                                          fileStats.priority === 1
                                            ? "error"
                                            : fileStats.priority === -1
                                              ? "default"
                                              : "primary"
                                        }
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              }}
                            </For>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Show>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Show>
        </Suspense>
      </Box>
    </>
  );
}
