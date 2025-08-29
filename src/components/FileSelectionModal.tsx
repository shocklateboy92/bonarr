import { createSignal, createMemo, For, Show } from "solid-js";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@suid/material";
import {
  Search,
  Clear,
  InsertDriveFile,
  Folder,
  Close,
} from "@suid/icons-material";
import { TorrentFile } from "../api/transmission";
import { transmissionClient } from "../api/transmission";

interface FileSelectionModalProps {
  open: boolean;
  onClose: () => void;
  episode: any;
  files: TorrentFile[];
  currentFile: TorrentFile | null;
  onFileSelect: (file: TorrentFile | null) => void;
}

export default function FileSelectionModal(props: FileSelectionModalProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [selectedFile, setSelectedFile] = createSignal<TorrentFile | null>(
    props.currentFile
  );

  const videoFiles = createMemo(() => {
    return props.files.filter((file) =>
      /\.(mkv|mp4|avi|m4v|mov|wmv|flv|webm|ts|m2ts)$/i.test(file.name)
    );
  });

  const filteredFiles = createMemo(() => {
    const query = searchQuery().toLowerCase();
    if (!query) return videoFiles();

    return videoFiles().filter((file) =>
      file.name.toLowerCase().includes(query)
    );
  });

  const organizedFiles = createMemo(() => {
    const files = filteredFiles();
    const organized: { [directory: string]: TorrentFile[] } = {};

    files.forEach((file) => {
      const pathParts = file.name.split("/");
      if (pathParts.length > 1) {
        const directory = pathParts.slice(0, -1).join("/");
        if (!organized[directory]) {
          organized[directory] = [];
        }
        organized[directory].push(file);
      } else {
        if (!organized["Root"]) {
          organized["Root"] = [];
        }
        organized["Root"].push(file);
      }
    });

    return organized;
  });

  const handleFileSelect = (file: TorrentFile) => {
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleConfirm = () => {
    props.onFileSelect(selectedFile());
    props.onClose();
  };

  const handleCancel = () => {
    setSelectedFile(props.currentFile);
    props.onClose();
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  const getFileExtension = (filename: string) => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
  };

  return (
    <Dialog
      open={props.open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          maxHeight: "90vh",
          m: { xs: 1, sm: 2 },
          maxWidth: { xs: "calc(100vw - 16px)", sm: "600px" },
        },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pr: 1,
          }}
        >
          <Box>
            <Typography variant="h6" component="div">
              Select File for Episode {props.episode?.episode_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              "{props.episode?.name}"
            </Typography>
          </Box>
          <IconButton onClick={handleCancel} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
        {/* Search Field */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search files..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchQuery() && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} size="small">
                  <Clear />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Current Selection */}
        <Show when={props.currentFile}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Current Selection:
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.5,
                bgcolor: "action.hover",
                borderRadius: 1,
              }}
            >
              <InsertDriveFile fontSize="small" />
              <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                {getFileName(props.currentFile?.name || "")}
              </Typography>
              <Chip
                label={transmissionClient.formatBytes(
                  props.currentFile?.length || 0
                )}
                size="small"
                variant="outlined"
              />
              <Button
                onClick={handleRemoveFile}
                size="small"
                color="error"
                variant="outlined"
              >
                Remove
              </Button>
            </Box>
          </Box>
        </Show>

        <Show when={!props.currentFile}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              No file currently selected
            </Typography>
          </Box>
        </Show>

        <Divider sx={{ mb: 2 }} />

        {/* File List */}
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          <Show when={filteredFiles().length === 0}>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">
                {searchQuery()
                  ? "No files match your search"
                  : "No video files found"}
              </Typography>
            </Box>
          </Show>

          <Show when={filteredFiles().length > 0}>
            <RadioGroup
              value={selectedFile()?.name || ""}
              onChange={(event) => {
                const value = (event.target as HTMLInputElement).value;
                const file = videoFiles().find((f) => f.name === value);
                if (file) handleFileSelect(file);
              }}
            >
              <For each={Object.entries(organizedFiles())}>
                {([directory, files]) => (
                  <Box sx={{ mb: 2 }}>
                    <Show when={directory !== "Root"}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                          pl: 1,
                        }}
                      >
                        <Folder color="primary" fontSize="small" />
                        <Typography variant="subtitle2" color="primary">
                          {directory}
                        </Typography>
                      </Box>
                    </Show>

                    <List dense disablePadding>
                      <For each={files}>
                        {(file) => (
                          <ListItem disablePadding>
                            <ListItemButton
                              onClick={() => handleFileSelect(file)}
                              sx={{ pl: directory !== "Root" ? 4 : 1 }}
                            >
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <Radio
                                  checked={selectedFile()?.name === file.name}
                                  value={file.name}
                                  size="small"
                                />
                              </ListItemIcon>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <InsertDriveFile fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight:
                                          selectedFile()?.name === file.name
                                            ? "medium"
                                            : "normal",
                                      }}
                                    >
                                      {getFileName(file.name)}
                                    </Typography>
                                    <Chip
                                      label={transmissionClient.formatBytes(
                                        file.length
                                      )}
                                      size="small"
                                      variant="outlined"
                                    />
                                    <Show when={getFileExtension(file.name)}>
                                      <Chip
                                        label={getFileExtension(file.name).toUpperCase()}
                                        size="small"
                                        color="secondary"
                                      />
                                    </Show>
                                  </Box>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        )}
                      </For>
                    </List>
                  </Box>
                )}
              </For>
            </RadioGroup>
          </Show>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
        <Button onClick={handleCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedFile() === props.currentFile}
        >
          Select File
        </Button>
      </DialogActions>
    </Dialog>
  );
}