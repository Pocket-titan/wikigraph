import { useState, useEffect } from "react";
import _ from "lodash";
import Modal from "components/Modal";
import { getImages } from "ts/wiki";
import useWindowSize from "ts/hooks/useWindowSize";
import { useStore } from "ts/hooks/useStore";
import Grid from "./Grid";
import { Typography } from "@material-ui/core";
import { ImageInfo } from "./ImageInfo";
import useCSSVariable from "ts/hooks/useCSSVariable";

type Image = {
  url: string;
  width: number;
  height: number;
  title: string;
  mediatype: string;
  mime: string;
};

const PageInfo = ({ title, connections = [] }: { title: string; connections?: string[] }) => {
  const [setClicked, language] = useStore((state) => [state.setClicked, state.language]);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);

      let images = await getImages(title, language);

      // console.log(`images`, images);

      setImages(
        images
          .map((image) => _.pick(image, "url", "width", "height", "title", "mediatype", "mime"))
          .filter(
            ({ mediatype }) =>
              mediatype === "BITMAP" || mediatype === "VIDEO" || mediatype === "DRAWING"
          )
      );
      setLoading(false);
    };

    main();
  }, [title]);

  // const width = _.clamp(70 * vw, 200, 1000);
  const paddingY = (useCSSVariable("--padding-y") || 1) as number;
  const width = _.clamp(90 * vw, 300, 1100) - 2 * paddingY;
  const rowHeight = _.clamp(20 * vh, 150, 250);

  return (
    <>
      {highlightedImage !== undefined && (
        <ImageInfo {...highlightedImage} onExited={() => setHighlightedImage(undefined)} />
      )}
      <Modal open={open} setOpen={setOpen} onExited={() => setClicked(undefined)}>
        <a
          href={`https://${language}.wikipedia.org/wiki/${title.split(" ").join("_")}`}
          target="_blank"
          rel="noreferrer"
          className="big-link"
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
          {loading ? (
            "Loading"
          ) : images.length === 0 ? (
            <Typography
              variant="body1"
              style={{
                color: "hsla(0, 0%, 100%, 0.88)",
              }}
            >
              No images found on this page :(
            </Typography>
          ) : (
            <Grid
              width={width}
              rowHeight={rowHeight}
              onClick={({ src: url, width, height, title, mediatype, resized }) => {
                if (resized) {
                  url = resized.src;
                  width = resized.width;
                  height = resized.height;
                }

                setHighlightedImage({
                  url,
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
          )}
        </ul>
      </Modal>
    </>
  );
};

export default PageInfo;
