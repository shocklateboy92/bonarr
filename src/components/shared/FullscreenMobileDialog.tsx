import { Dialog } from "@suid/material";
import { JSX, ComponentProps } from "solid-js";

interface FullscreenMobileDialogProps extends ComponentProps<typeof Dialog> {
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