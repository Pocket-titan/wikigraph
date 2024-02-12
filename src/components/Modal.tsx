import { CSSProperties, ComponentProps, PropsWithChildren, useState } from "react";
import { Modal as MuiModal, Backdrop, Paper } from "@material-ui/core";
import { Fade } from "./Fade";

const CrossMark = ({
  width,
  height,
  onClick,
}: {
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
}) => (
  <svg
    className="cross-mark"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 384 512"
    width={width}
    height={height}
    onClick={onClick}
  >
    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
  </svg>
);

const UncontrolledModal = ({
  open,
  setOpen,
  children,
  onExited,
  modalStyle = {},
  fadeStyle = {},
  paperStyle = {},
  backdropStyle = {},
}: PropsWithChildren<{
  open: boolean;
  setOpen: (open: boolean) => void;
  onExited?: () => void;
  modalStyle?: CSSProperties;
  fadeStyle?: CSSProperties;
  paperStyle?: CSSProperties;
  backdropStyle?: CSSProperties;
}>) => {
  return (
    <MuiModal
      open={open}
      className="modal"
      onClose={() => setOpen(false)}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 250,
        style: {
          cursor: "pointer",
          zIndex: -5,
          ...backdropStyle,
        },
      }}
      style={modalStyle}
    >
      <Fade in={open} onExited={onExited} style={fadeStyle}>
        <Paper className="paper" style={{ ...paperStyle, position: "relative" }}>
          {children}
          <div style={{ position: "absolute", top: 0, right: 0, padding: 6 }}>
            <CrossMark width={35} height={35} onClick={() => setOpen(false)} />
          </div>
        </Paper>
      </Fade>
    </MuiModal>
  );
};

type Props = ComponentProps<typeof UncontrolledModal>;

const ControlledModal = (props: Omit<Props, "open" | "setOpen">) => {
  const [open, setOpen] = useState(false);

  return <UncontrolledModal open={open} setOpen={setOpen} {...props} />;
};

const Modal = ({
  open,
  setOpen,
  ...props
}: Omit<Props, "open" | "setOpen"> & Partial<Pick<Props, "open" | "setOpen">>) => {
  if (open !== undefined && setOpen !== undefined) {
    return <UncontrolledModal {...{ open, setOpen, ...props }} />;
  }

  return <ControlledModal {...props} />;
};

export default Modal;
