import { createResource, Show, Suspense, For } from "solid-js";
import { useParams, A } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Button,
  Chip,
} from "@suid/material";
import { ArrowBack } from "@suid/icons-material";
import { getComicVineVolume, getVolumeIssues } from "../queries/comicvine-api";

export default function VolumeDetail() {
  const params = useParams();

  const [volume] = createResource(
    () => params.id,
    async (id) => {
      return await getComicVineVolume(parseInt(id));
    },
  );

  const [issues] = createResource(
    () => params.id,
    async (id) => {
      return await getVolumeIssues(parseInt(id));
    },
  );

  return (
    <>
      <Title>{volume()?.name ? `${volume()?.name} | Bonarr` : "Volume Details | Bonarr"}</Title>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 1, md: 2 } }}>
      <Box sx={{ mb: 3 }}>
        <A href="/">
          <Button startIcon={<ArrowBack />} variant="outlined">
            Back to Search
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
        <Show when={volume.error}>
          <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
            Error: {volume.error?.message}
          </Typography>
        </Show>

        <Show when={volume()}>
          {(vol) => (
            <>
              {/* Metadata Card */}
              <Card sx={{ mb: 4 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 3,
                      alignItems: { xs: "center", sm: "flex-start" },
                    }}
                  >
                    <Show when={vol().image?.super_url}>
                      <img
                        src={vol().image.super_url}
                        alt={vol().name}
                        style={{
                          width: "200px",
                          "border-radius": "8px",
                          "box-shadow": "0 4px 8px rgba(0,0,0,0.2)",
                          "flex-shrink": "0",
                        }}
                      />
                    </Show>

                    <Box sx={{ flex: 1, textAlign: { xs: "center", sm: "left" } }}>
                      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
                        {vol().name}
                      </Typography>

                      <Show when={vol().deck}>
                        <Typography
                          variant="h6"
                          sx={{ mb: 2, fontStyle: "italic", color: "text.secondary" }}
                        >
                          {vol().deck}
                        </Typography>
                      </Show>

                      <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap", justifyContent: { xs: "center", sm: "flex-start" } }}>
                        <Show when={vol().publisher?.name}>
                          <Chip label={vol().publisher.name} color="primary" />
                        </Show>
                        <Show when={vol().start_year}>
                          <Chip label={vol().start_year} variant="outlined" />
                        </Show>
                        <Show when={vol().count_of_issues}>
                          <Chip label={`${vol().count_of_issues} Issues`} color="secondary" />
                        </Show>
                      </Box>

                      <Show when={vol().description}>
                        <Typography 
                          variant="body1" 
                          sx={{ lineHeight: 1.6, maxHeight: "150px", overflow: "auto" }}
                          innerHTML={vol().description}
                        />
                      </Show>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Issues Grid */}
              <Show when={issues()}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                  Issues ({issues()!.length})
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(2, 1fr)",
                      sm: "repeat(3, 1fr)",
                      md: "repeat(4, 1fr)",
                      lg: "repeat(6, 1fr)",
                    },
                    gap: 2,
                  }}
                >
                  <For each={issues()}>
                    {(issue) => (
                      <Card
                        sx={{
                          cursor: "pointer",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                            transform: "translateY(-4px)",
                          },
                        }}
                      >
                        <Show when={issue.image?.medium_url}>
                          <img
                            src={issue.image.medium_url}
                            alt={`Issue #${issue.issue_number}`}
                            style={{
                              width: "100%",
                              height: "auto",
                              "aspect-ratio": "2/3",
                              "object-fit": "cover",
                              display: "block",
                            }}
                          />
                        </Show>
                        <CardContent sx={{ p: 1.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            #{issue.issue_number}
                          </Typography>
                          <Show when={issue.name}>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {issue.name}
                            </Typography>
                          </Show>
                          <Show when={issue.cover_date}>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(issue.cover_date).getFullYear()}
                            </Typography>
                          </Show>
                        </CardContent>
                      </Card>
                    )}
                  </For>
                </Box>
              </Show>

              <Show when={issues.loading}>
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }}>Loading issues...</Typography>
                </Box>
              </Show>
            </>
          )}
        </Show>
      </Suspense>
      </Box>
    </>
  );
}