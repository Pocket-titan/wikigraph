import React, { useState, useEffect, useMemo } from "react";
import _ from "lodash";
import Modal from "@material-ui/core/Modal";
import Backdrop from "@material-ui/core/Backdrop";
import Paper from "@material-ui/core/Paper";
import { animated, useSpring, useTransition } from "react-spring";
import { getFileUsage, getImages } from "ts/wiki";
import useWindowSize from "ts/hooks/useWindowSize";
import { useStore } from "ts/hooks/useStore";
import { beautifyTitle } from "ts/utils";
import Grid from "./Grid";

const Fade = React.forwardRef<
  HTMLDivElement,
  {
    in: boolean;
    children?: React.ReactElement;
    onEnter?: () => void;
    onExited?: () => void;
  }
>(function Fade({ in: open, children, onEnter, onExited, ...other }, ref) {
  const spring = useMemo(() => {
    return {
      from: { opacity: 0 },
      config: {
        duration: 250,
      },
      enter: (isOpen: boolean) => async (next) => {
        if (isOpen && onEnter) {
          onEnter();
        }

        await next({ opacity: 1 });

        if (!isOpen && onExited) {
          onExited();
        }
      },
      leave: (isOpen) => async (next, cancel) => {
        await next({ opacity: 0 });
      },
    };
  }, [onEnter, onExited]);
  const transitions = useTransition(open, null, spring as any);

  return (
    <>
      {transitions.map(({ item, key, props }) => {
        return (
          item && (
            <animated.div key={key} style={{ ...props, outline: "none" }} {...other}>
              {children}
            </animated.div>
          )
        );
      })}
    </>
  );
});

const ImageInfo = ({
  url,
  width,
  height,
  title,
  mediatype,
  onExited,
}: {
  url: string;
  width: number;
  height: number;
  title: string;
  mediatype: "BITMAP" | "VIDEO";
  onExited?: () => void;
}) => {
  const [usage, setUsage] = useState<{ title: string; url: string }[]>([]);
  const [open, setOpen] = useState(true);

  const beautifulTitle = beautifyTitle(title);

  useEffect(() => {
    const main = async () => {
      const usage = await getFileUsage(title);
      setUsage(usage);
    };

    main();
  }, []);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 250,
        style: {
          background: "hsla(0, 0%, 0%, 0.5)",
        },
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        marginTop: "3vh",
      }}
    >
      <Fade in={open} onExited={onExited}>
        <Paper
          style={{
            paddingLeft: "1.75em",
            paddingRight: "1.75em",
            paddingTop: "0.35em",
            paddingBottom: "1em",
            width: "50vw",
            maxHeight: "95vh",
            color: "hsla(0, 0%, 100%, 0.88)",
            backgroundColor: "hsl(222, 14%, 19%)",
          }}
        >
          <a
            href={`https://commons.wikimedia.org/wiki/${title.replace(
              "Bestand",
              "File"
            )}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              fontSize: "1.75em",
              fontWeight: "bold",
              marginTop: "0.5em",
              marginBottom: "0.5em",
              color: "hsla(0, 0%, 100%, 0.88)",
            }}
          >
            {beautifulTitle}
          </a>
          {mediatype === "BITMAP" && (
            <img
              src={url}
              title={title}
              alt={title}
              style={{
                objectFit: "contain",
                width: "100%",
                maxHeight: "35vh",
                objectPosition: "0 0",
              }}
            />
          )}
          {mediatype === "VIDEO" && (
            <video
              src={url + "#t=0.5"}
              title={title}
              controls
              preload="metadata"
              style={{
                objectFit: "contain",
                maxHeight: "35vh",
              }}
              onLoadStart={({ target }) => {
                (target as HTMLVideoElement).volume = 0.15;
              }}
            />
          )}
          <h3
            style={{
              marginTop: "0.5em",
              marginBottom: "0.5em",
            }}
          >
            File usage
          </h3>
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              paddingLeft: 0,
              marginTop: 0,
              marginBottom: "0.5em",
            }}
          >
            {usage.map(({ title, url }) => {
              return (
                <li
                  key={title}
                  style={{
                    listStyle: "none",
                  }}
                >
                  <a href={url} target="_blank" rel="noreferrer" className="colored-link">
                    {title}
                  </a>
                </li>
              );
            })}
          </ul>
        </Paper>
      </Fade>
    </Modal>
  );
};

type Image = {
  url: string;
  width: number;
  height: number;
  title: string;
  mediatype: string;
  mime: string;
};

const PageInfo = ({ title }: { title: string }) => {
  const setClicked = useStore((state) => state.setClicked);
  const [images, setImages] = useState<Image[]>([]);
  const [highlightedImage, setHighlightedImage] = useState<{
    width: number;
    height: number;
    url: string;
    title: string;
    mediatype: "BITMAP" | "VIDEO";
  }>();
  const [open, setOpen] = useState(true);
  const { vw, vh } = useWindowSize();

  useEffect(() => {
    const main = async () => {
      let images = await getImages(title);

      console.log(`images`, images);

      setImages(
        images
          .map((image) =>
            _.pick(image, "url", "width", "height", "title", "mediatype", "mime")
          )
          .filter(
            ({ mediatype }) =>
              mediatype === "BITMAP" || mediatype === "VIDEO" || mediatype === "DRAWING"
          )
      );
    };
    main();
  }, [title]);

  const width = _.clamp(70 * vw, 200, 1000);
  const rowHeight = _.clamp(20 * vh, 150, 250);

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 250,
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        marginTop: "9vh",
      }}
    >
      <Fade in={open} onExited={() => setClicked(undefined)}>
        <Paper
          style={{
            paddingLeft: "1.75em",
            paddingRight: "1.75em",
            paddingTop: "0.35em",
            paddingBottom: "0.5em",
            // width: clamp(200px, 70vw, 1200px),
            width,
            maxHeight: "80vh",
            overflowY: "auto",
            backgroundColor: "hsl(222, 14%, 19%)",
          }}
        >
          <a
            href={`https://nl.wikipedia.org/wiki/${title.split(" ").join("_")}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              fontSize: "1.75em",
              fontWeight: "bold",
              marginTop: "0.5em",
              color: "hsla(0, 0%, 100%, 0.88)",
            }}
          >
            {title}
          </a>
          <ul
            style={{
              display: "flex",
              flexWrap: "wrap",
              padding: 0,
            }}
          >
            <Grid
              width={width}
              rowHeight={rowHeight}
              onClick={({ src, width, height, title, mediatype }) => {
                setHighlightedImage({
                  url: src,
                  width,
                  height,
                  title,
                  mediatype,
                });
              }}
              media={images.map(({ url, width, height, title = "", mediatype }) => {
                // title = beautifyTitle(title);
                const shortTitle = title.length > 15 ? title.slice(0, 15) + "..." : title;

                return {
                  width,
                  height,
                  src: url,
                  title,
                  ...(mediatype === "VIDEO"
                    ? {
                        mediatype: "VIDEO",
                      }
                    : {
                        alt: shortTitle,
                        mediatype: "BITMAP",
                      }),
                };
              })}
            />
          </ul>
          {highlightedImage !== undefined && (
            <ImageInfo
              {...highlightedImage}
              onExited={() => setHighlightedImage(undefined)}
            />
          )}
        </Paper>
      </Fade>
    </Modal>
  );
};

export default PageInfo;
