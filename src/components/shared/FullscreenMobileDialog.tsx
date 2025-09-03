import { Dialog, DialogContent, DialogActions } from "@suid/material";
import { JSX, ComponentProps } from "solid-js";

interface FullscreenMobileDialogProps extends ComponentProps<typeof Dialog> {
  children: JSX.Element;
}

interface FullscreenMobileDialogContentProps extends ComponentProps<typeof DialogContent> {
  children: JSX.Element;
}

interface FullscreenMobileDialogActionsProps extends ComponentProps<typeof DialogActions> {
  children: JSX.Element;
}

export default function FullscreenMobileDialog(props: FullscreenMobileDialogProps) {
  const { children, sx, ...dialogProps } = props;

  return (
    <Dialog
      {...dialogProps}
      sx={{
        "& .MuiDialog-paper": {
          maxHeight: { xs: "100vh", sm: "90vh" },
          m: { xs: 0, sm: 2 },
          maxWidth: { xs: "100vw", sm: "600px" },
          width: { xs: "100vw", sm: "auto" },
          height: { xs: "100vh", sm: "auto" },
          borderRadius: { xs: 0, sm: 1 },
        },
        ...sx,
      }}
    >
      {children}
    </Dialog>
  );
}

export function FullscreenMobileDialogContent(props: FullscreenMobileDialogContentProps) {
  const { children, sx, ...contentProps } = props;

  return (
    <DialogContent
      {...contentProps}
      sx={{
        px: { xs: 1, sm: 3 },
        py: { xs: 1, sm: 2 },
        ...sx,
      }}
    >
      {children}
    </DialogContent>
  );
}

export function FullscreenMobileDialogActions(props: FullscreenMobileDialogActionsProps) {
  const { children, sx, ...actionsProps } = props;

  return (
    <DialogActions
      {...actionsProps}
      sx={{
        px: { xs: 1, sm: 3 },
        pb: { xs: 1, sm: 3 },
        pt: { xs: 1, sm: 2 },
        ...sx,
      }}
    >
      {children}
    </DialogActions>
  );
}