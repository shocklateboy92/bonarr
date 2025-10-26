import { Box, CircularProgress, Typography } from "@suid/material";
import { Resource, Switch, Match } from "solid-js";
import type { JSX } from "solid-js";

interface ResourceDisplayProps<T> {
  resource: Resource<T>;
  children: (data: NonNullable<T>) => JSX.Element;
}

export default function ResourceDisplay<T>(props: ResourceDisplayProps<T>) {
  return (
    <Switch>
      <Match when={props.resource.state === "errored"}>
        <Typography color="error" sx={{ textAlign: "center", my: 2 }}>
          Error: {props.resource.error?.message}
        </Typography>
      </Match>

      <Match when={props.resource.state === "ready" && props.resource()}>
        {(data) => props.children(data())}
      </Match>

      <Match when={true}>
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      </Match>
    </Switch>
  );
}
