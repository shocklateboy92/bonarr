import { Router, Route, A } from "@solidjs/router";
import { Container, Typography, Box, Button } from "@suid/material";
import TVShowSearch from "./components/TVShowSearch";
import TVShowDetail from "./components/TVShowDetail";
import SeasonDetail from "./components/SeasonDetail";
import TorrentsList from "./components/TorrentsList";
import TorrentFiles from "./components/TorrentFiles";

function Layout(props: any) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h2" component="h1" sx={{ textAlign: 'center', mb: 3 }}>
        Bonarr - TV Show Manager
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        <A href="/" style={{ "text-decoration": "none" }}>
          <Button variant="outlined">TV Shows</Button>
        </A>
        <A href="/torrents" style={{ "text-decoration": "none" }}>
          <Button variant="outlined">Torrents</Button>
        </A>
      </Box>
      
      {props.children}
    </Container>
  );
}

export default function App() {
  return (
    <Router root={Layout}>
      <Route path="/" component={TVShowSearch} />
      <Route path="/torrents" component={TorrentsList} />
      <Route path="/torrents/:id" component={TorrentFiles} />
      <Route path="/show/:id" component={TVShowDetail} />
      <Route path="/show/:id/season/:seasonNumber" component={SeasonDetail} />
    </Router>
  );
}
