import { Container, Typography } from "@suid/material";
import TVShowDetail from "../../../components/TVShowDetail";

export default function ShowDetail() {
  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, sm: 2 } }}
    >
      <Typography
        variant="h2"
        component="h1"
        sx={{
          textAlign: "center",
          mb: { xs: 2, md: 4 },
          fontSize: { xs: "2rem", sm: "2.5rem", md: "3.75rem" },
        }}
      >
        Bonarr - TV Show Manager
      </Typography>
      <TVShowDetail />
    </Container>
  );
}
