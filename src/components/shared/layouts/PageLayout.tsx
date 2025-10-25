import { Container, Typography } from "@suid/material";
import { JSX } from "solid-js";
import { A } from "@solidjs/router";

interface PageLayoutProps {
  children: JSX.Element;
}

export default function PageLayout(props: PageLayoutProps) {
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
        <A href="/" style={{ color: "inherit", "text-decoration": "none" }}>
          Bonarr - TV Show Manager
        </A>
      </Typography>
      {props.children}
    </Container>
  );
}
