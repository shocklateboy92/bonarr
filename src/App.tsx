import { Router, Route } from "@solidjs/router";
import { Container, Typography } from "@suid/material";
import TVShowSearch from "./components/TVShowSearch";
import TVShowDetail from "./components/TVShowDetail";
import SeasonDetail from "./components/SeasonDetail";

function Layout(props: any) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" sx={{ textAlign: 'center', mb: 4 }}>
        Bonarr - TV Show Search
      </Typography>
      {props.children}
    </Container>
  );
}

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={TVShowSearch} />
      <Route path="/show/:id" component={TVShowDetail} />
      <Route path="/show/:id/season/:seasonNumber" component={SeasonDetail} />
    </Router>
  );
}
