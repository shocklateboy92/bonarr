import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { Container, Typography, Button, Box } from "@suid/material";

export default function NotFound() {
  return (
    <>
      <Title>404 - Page Not Found | Bonarr</Title>
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            textAlign: "center",
            gap: 3
          }}
        >
          <Typography variant="h1" component="h1" sx={{ fontSize: "6rem", fontWeight: "bold" }}>
            404
          </Typography>
          <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            The page you're looking for doesn't exist or has been moved.
          </Typography>
          <Button
            component={A}
            href="/"
            variant="contained"
            size="large"
          >
            Go Home
          </Button>
        </Box>
      </Container>
    </>
  );
}