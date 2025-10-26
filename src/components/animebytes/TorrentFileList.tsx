import { createSignal, Show, For } from "solid-js";
import { Box, Button, Typography } from "@suid/material";
import {
  ExpandMore,
  ExpandLess,
  InsertDriveFile,
  Folder,
} from "@suid/icons-material";
import type { AnimeBytesTorrent } from "../../queries/animebytes-api";

interface TorrentFileListProps {
  torrent: AnimeBytesTorrent;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function TorrentFileList(props: TorrentFileListProps) {
  const [isExpanded, setIsExpanded] = createSignal(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded());
  };

  if (!props.torrent.FileList || Object.keys(props.torrent.FileList).length === 0) {
    return null;
  }

  return (
      <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: "divider" }}>
        <Button
          variant="text"
          size="small"
          onClick={toggleExpanded}
          endIcon={isExpanded() ? <ExpandLess /> : <ExpandMore />}
        >
          {isExpanded() ? "Hide" : "Show"} Files (
          {Object.keys(props.torrent.FileList).length})
        </Button>

        <Show when={isExpanded()}>
          <Box
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              backgroundColor: "background.default",
              borderRadius: 1,
              p: 1,
            }}
          >
            <For each={Object.values(props.torrent.FileList)}>
              {(fileInfo) => {
                const path = fileInfo.filename;
                const fileName = path.split("/").pop() || path;
                const directory = path.includes("/")
                  ? path.substring(0, path.lastIndexOf("/"))
                  : "";

                return (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 0.5,
                      px: 1,
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    {path.includes("/") ? (
                      <Folder fontSize="small" color="primary" />
                    ) : (
                      <InsertDriveFile fontSize="small" color="action" />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: "medium",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fileName}
                      </Typography>
                      <Show when={directory}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "block",
                          }}
                        >
                          📁 {directory}
                        </Typography>
                      </Show>
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ flexShrink: 0 }}
                    >
                      {formatFileSize(fileInfo.size)}
                    </Typography>
                  </Box>
                );
              }}
            </For>
          </Box>
        </Show>
      </Box>
  );
}
