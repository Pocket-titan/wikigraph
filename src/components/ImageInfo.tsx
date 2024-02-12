import { useState, useEffect } from "react";
import { getFileUsage } from "ts/wiki";
import { useStore } from "ts/hooks/useStore";
import { beautifyTitle } from "ts/utils";
import Modal from "components/Modal";

export const ImageInfo = ({
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
  const language = useStore((state) => state.language);

  const beautifulTitle = beautifyTitle(title);

  useEffect(() => {
    const main = async () => {
      const usage = await getFileUsage(title, language);
      setUsage(usage || []);
    };

    main();
  }, []);

  // const src =
  //   mediatype === "BITMAP"
  //     ? maybeResizeImage({ src: url, width, height }, { maxWidth: 9999, maxHeight: 35 * vh })
  //         ?.resized?.src || url
  //     : url;

  const src = url;

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      onExited={onExited}
      backdropStyle={{
        background: "hsla(0, 0%, 0%, 0.6)",
      }}
      fadeStyle={
        {
          "--margin-y": "calc(2 * var(--y))",
        } as any
      }
    >
      <a
        href={`https://commons.wikimedia.org/wiki/${title.replace("Bestand", "File")}`}
        target="_blank"
        rel="noreferrer"
        className="medium-link"
      >
        {beautifulTitle}
      </a>
      {mediatype === "BITMAP" && (
        <img
          src={src}
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
          src={src + "#t=0.5"}
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
    </Modal>
  );
};
