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
import { getTVShowDetails } from "../api/tmdb";

export default function TVShowDetail() {
  const params = useParams();

  const [tvShow] = createResource(
    () => params.id,
    async (id) => {
      return await getTVShowDetails(parseInt(id));
    },
  );

  return (
    <>
      <Title>{tvShow()?.name ? `${tvShow()?.name} | Bonarr` : "TV Show Details | Bonarr"}</Title>
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
        <Show when={tvShow.error}>
          <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
            Error: {tvShow.error?.message}
          </Typography>
        </Show>

        <Show when={tvShow()}>
          {(show) => (
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: { xs: 2, md: 4 },
                    alignItems: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Show when={show().poster_path}>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${show().poster_path}`}
                      alt={show().name}
                      style={{
                        width: "100%",
                        "max-width": "300px",
                        "border-radius": "8px",
                        "box-shadow": "0 4px 8px rgba(0,0,0,0.2)",
                        "flex-shrink": "0",
                      }}
                    />
                  </Show>

                  <Box
                    sx={{
                      flex: 1,
                      minWidth: { xs: "100%", md: "300px" },
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    <Typography
                      variant="h3"
                      component="h1"
                      sx={{
                        mb: 2,
                        fontSize: { xs: "1.75rem", md: "3rem" },
                      }}
                    >
                      {show().name}
                    </Typography>

                    <Show when={show().tagline}>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          fontStyle: "italic",
                          color: "text.secondary",
                        }}
                      >
                        "{show().tagline}"
                      </Typography>
                    </Show>

                    <Box
                      sx={{
                        mb: 3,
                        display: "flex",
                        gap: { xs: 1, sm: 2 },
                        flexWrap: "wrap",
                        justifyContent: { xs: "center", md: "flex-start" },
                      }}
                    >
                      <Show when={show().first_air_date}>
                        <Chip
                          label={`First aired: ${show().first_air_date}`}
                          variant="outlined"
                        />
                      </Show>
                      <Show when={show().vote_average}>
                        <Chip
                          label={`Rating: ${show().vote_average?.toFixed(1)}/10`}
                          color={
                            show().vote_average! > 7
                              ? "success"
                              : show().vote_average! > 5
                                ? "primary"
                                : "default"
                          }
                        />
                      </Show>
                      <Show when={show().status}>
                        <Chip
                          label={show().status}
                          color={
                            show().status === "Ended" ? "default" : "success"
                          }
                        />
                      </Show>
                    </Box>

                    <Show when={show().genres && show().genres!.length > 0}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Genres
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            flexWrap: "wrap",
                            justifyContent: { xs: "center", md: "flex-start" },
                          }}
                        >
                          <For each={show().genres}>
                            {(genre) => (
                              <Chip label={genre.name} size="small" />
                            )}
                          </For>
                        </Box>
                      </Box>
                    </Show>

                    <Show when={show().overview}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Overview
                        </Typography>
                        <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                          {show().overview}
                        </Typography>
                      </Box>
                    </Show>

                    <Box
                      sx={{
                        display: "flex",
                        gap: { xs: 2, md: 3 },
                        flexWrap: "wrap",
                        justifyContent: { xs: "center", md: "flex-start" },
                      }}
                    >
                      <Show when={show().number_of_seasons}>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Seasons
                          </Typography>
                          <Typography variant="h6">
                            {show().number_of_seasons}
                          </Typography>
                        </Box>
                      </Show>

                      <Show when={show().number_of_episodes}>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Episodes
                          </Typography>
                          <Typography variant="h6">
                            {show().number_of_episodes}
                          </Typography>
                        </Box>
                      </Show>

                      <Show
                        when={
                          show().episode_run_time &&
                          show().episode_run_time!.length > 0
                        }
                      >
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            Episode Runtime
                          </Typography>
                          <Typography variant="h6">
                            {show().episode_run_time![0]} min
                          </Typography>
                        </Box>
                      </Show>
                    </Box>
                  </Box>
                </Box>

                <Show when={show().seasons && show().seasons!.length > 0}>
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                      Seasons
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, 1fr)",
                          md: "repeat(3, 1fr)",
                          lg: "repeat(4, 1fr)",
                        },
                        gap: 2,
                      }}
                    >
                      <For each={show().seasons}>
                        {(season) => (
                          <A
                            href={`/show/${params.id}/season/${season.season_number}`}
                            style={{
                              "text-decoration": "none",
                              color: "inherit",
                            }}
                          >
                            <Card
                              sx={{
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                                "&:hover": {
                                  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                  transform: "translateY(-2px)",
                                },
                                height: "100%",
                              }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Show when={season.poster_path}>
                                  <img
                                    src={`https://image.tmdb.org/t/p/w300${season.poster_path}`}
                                    alt={season.name}
                                    style={{
                                      width: "100%",
                                      height: "200px",
                                      "object-fit": "cover",
                                      "border-radius": "4px",
                                      "margin-bottom": "8px",
                                    }}
                                  />
                                </Show>
                                <Typography
                                  variant="h6"
                                  component="h3"
                                  sx={{ mb: 1 }}
                                >
                                  {season.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 1 }}
                                >
                                  {season.episode_count} episodes
                                </Typography>
                                <Show when={season.air_date}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Aired: {season.air_date}
                                  </Typography>
                                </Show>
                                <Show when={season.overview}>
                                  <Typography
                                    variant="body2"
                                    sx={{ mt: 1 }}
                                    style={{
                                      display: "-webkit-box",
                                      "-webkit-line-clamp": 3,
                                      "-webkit-box-orient": "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {season.overview}
                                  </Typography>
                                </Show>
                              </CardContent>
                            </Card>
                          </A>
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
    </>
  );
}
