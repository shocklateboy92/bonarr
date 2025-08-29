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
      <Typography variant="h2" component="h1" sx={{ textAlign: 'center', mb: 4 }}>
        Bonarr - TV Show Manager
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
      <Route path="/show/:id/season/:seasonNumber/torrents" component={TorrentsList} />
      <Route path="/show/:id/season/:seasonNumber/torrents/:torrentId" component={TorrentFiles} />
    </Router>
  );
}
