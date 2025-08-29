import { Router, Route } from "@solidjs/router";
import { Container, Typography } from "@suid/material";
import TVShowSearch from "./components/TVShowSearch";
import TVShowDetail from "./components/TVShowDetail";

export default function App() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="h2"
        component="h1"
        sx={{ textAlign: "center", mb: 4 }}
      >
        Bonarr - TV Show Search
      </Typography>
      <Router>
        <Route path="/" component={TVShowSearch} />
        <Route path="/show/:id" component={TVShowDetail} />
      </Router>
    </Container>
  );
}
