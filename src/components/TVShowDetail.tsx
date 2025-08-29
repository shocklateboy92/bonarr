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
import { ArrowBack } from "@suid/icons-material";
import { getTVShowDetails } from "../api/tmdb";

export default function TVShowDetail() {
  const params = useParams();
  
  const [tvShow] = createResource(
    () => params.id,
    async (id) => {
      return await getTVShowDetails(parseInt(id));
    }
  );

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 2 }}>
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
                <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <Show when={show().poster_path}>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${show().poster_path}`}
                      alt={show().name}
                      style={{
                        width: "300px",
                        "border-radius": "8px",
                        "box-shadow": "0 4px 8px rgba(0,0,0,0.2)",
                      }}
                    />
                  </Show>
                  
                  <Box sx={{ flex: 1, minWidth: "300px" }}>
                    <Typography variant="h3" component="h1" sx={{ mb: 2 }}>
                      {show().name}
                    </Typography>
                    
                    <Show when={show().tagline}>
                      <Typography 
                        variant="h6" 
                        sx={{ mb: 2, fontStyle: "italic", color: "text.secondary" }}
                      >
                        "{show().tagline}"
                      </Typography>
                    </Show>

                    <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <Show when={show().first_air_date}>
                        <Chip 
                          label={`First aired: ${show().first_air_date}`} 
                          variant="outlined" 
                        />
                      </Show>
                      <Show when={show().vote_average}>
                        <Chip 
                          label={`Rating: ${show().vote_average?.toFixed(1)}/10`}
                          color={show().vote_average! > 7 ? "success" : show().vote_average! > 5 ? "primary" : "default"}
                        />
                      </Show>
                      <Show when={show().status}>
                        <Chip 
                          label={show().status} 
                          color={show().status === "Ended" ? "default" : "success"}
                        />
                      </Show>
                    </Box>

                    <Show when={show().genres && show().genres!.length > 0}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Genres
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
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

                    <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Show when={show().number_of_seasons}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Seasons
                          </Typography>
                          <Typography variant="h6">
                            {show().number_of_seasons}
                          </Typography>
                        </Box>
                      </Show>
                      
                      <Show when={show().number_of_episodes}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            Episodes
                          </Typography>
                          <Typography variant="h6">
                            {show().number_of_episodes}
                          </Typography>
                        </Box>
                      </Show>

                      <Show when={show().episode_run_time && show().episode_run_time!.length > 0}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
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
              </CardContent>
            </Card>
          )}
        </Show>
      </Suspense>
    </Box>
  );
}