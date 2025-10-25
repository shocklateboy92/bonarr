import { Box, CircularProgress, Typography } from "@suid/material";
import { Resource, Show } from "solid-js";
import type { JSX } from "solid-js";

interface ResourceDisplayProps<T> {
  resource: Resource<T>;
  children: (data: NonNullable<T>) => JSX.Element;
}

export default function ResourceDisplay<T>(props: ResourceDisplayProps<T>) {
  return (
    <>
      <Show when={props.resource.error}>
        <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
          Error: {props.resource.error?.message}
        </Typography>
      </Show>

      <Show
        when={props.resource.state === "ready" && props.resource()}
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        }
      >
        {(data) => props.children(data())}
      </Show>
    </>
  );
}
