// Adapted from: https://github.com/AustinGomez/react-image-grid
// I needed video elements too 🙃
import _ from "lodash";
import { useState, useCallback, useMemo } from "react";
import { beautifyTitle, maybeResizeImage } from "ts/utils";

type MediaData = {
  width: number;
  height: number;
  src: string;
  title: string;
};

type Resized = {
  src: string;
  width: number;
  height: number;
};

type Image = MediaData & { mediatype: "BITMAP"; alt: string } & { resized?: Resized };

type Video = MediaData & { mediatype: "VIDEO" } & { resized?: Resized };

type Media = Image | Video;

const Grid = ({
  media,
  rowHeight,
  width,
  margin = 0,
  onClick = () => {},
}: {
  media: Media[];
  rowHeight: number;
  width: number;
  margin?: number;
  onClick?: (media: Media) => void;
}) => {
  media = media.map((media) => {
    if (media.mediatype === "BITMAP") {
      return maybeResizeImage(media as Image, { maxWidth: 500, maxHeight: 500 });
    } else {
      return media;
    }
  });

  // Creates <img/> or <video/> tags from media and row metadata.
  const mediaDataToTag = useCallback(
    (
      media: [Media, number],
      totalIndex: number,
      rowIndex: number,
      row: [Media, number][],
      mediaWidth: number
    ) => {
      const calculatedRowHeight = width / mediaWidth;

      // Calculate the dimensions and margin of each media. This needs
      // to be inline since we need some values from the JS.
      let style = {
        height: calculatedRowHeight + "px",

        // Take back out the margin from the ratio.
        width: calculatedRowHeight * media[1] - margin + "px",

        // Don't add margin to the last item in a row
        marginRight: rowIndex === row.length - 1 ? 0 : margin + "px",

        // idk?
        verticalAlign: "bottom",
        cursor: "pointer",
      };

      if (media[0].mediatype === "BITMAP") {
        const image = media as [Image, number];

        const beautifulTitle = beautifyTitle(image[0].title);

        const src = image[0].resized ? image[0].resized.src : image[0].src;

        return (
          <img
            style={style}
            data-index={totalIndex}
            src={src}
            title={beautifulTitle}
            alt={image[0].alt}
            key={"img_" + src + "_" + image[1]}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              onClick(image[0]);
            }}
          />
        );
      } else {
        const video = media as [Video, number];

        const beautifulTitle = beautifyTitle(video[0].title);

        return (
          <video
            controls
            style={{ ...style, objectFit: "cover" }}
            data-index={totalIndex}
            src={video[0].src + "#t=0.5"}
            title={beautifulTitle}
            preload="metadata"
            key={"vid_" + video[0].src + "_" + video[1]}
            onLoadStart={({ target }) => {
              (target as HTMLVideoElement).volume = 0.15;
            }}
            onClick={(event) => {
              event.preventDefault();

              const target = event.target as HTMLVideoElement;
              if (!target.paused) {
                target.pause();
              }

              onClick(video[0]);
            }}
          />
        );
      }
    },
    [margin, width, onClick]
  );

  // Build the rows of the grid. Each row must have an aspect ratio of at least minAspectRatio.
  // Then, each image in the row is scaled up to fill the desired width of the row, while maintaining
  // the aspect ratio of each photo in the row.
  const rows = useMemo(() => {
    let allRows: JSX.Element[][] = [];
    let row: [Media, number][] = [];
    let widthSoFar = 0;

    // We'll use this value to calculate how many pictures we need in a row.
    // The "min" aspect ratio is the aspect ratio that will allow the row to
    // span the correct length while being between minRowHeight and maxRowHeight
    const minAspectRatio = width / rowHeight;

    for (let i = 0; i < media.length; i++) {
      let image = media[i];

      // Add the margin into the ratio.
      let ratio = image.width / image.height;

      // If we're less than the min aspectRatio then keep adding more items to the row.
      if (widthSoFar <= minAspectRatio && i !== media.length - 1) {
        // Add the ratio contributed by the margin.
        ratio += margin / image.height;
        row.push([image, ratio]);
        widthSoFar += ratio;
      } else {
        if (i === media.length - 1) {
          row.push([image, ratio]);
          widthSoFar += ratio;
        }
        let elements: JSX.Element[] = [];
        for (let j = 0; j < row.length; j++) {
          elements.push(mediaDataToTag(row[j], i - row.length + j, j, row, widthSoFar));
        }
        // Add the finished row to the list of all rows.
        allRows.push(elements);

        // Start a new row with the current image as the first image
        row = [[image, ratio]];
        widthSoFar = ratio;
      }
    }

    // This style also needs to be inline since we use the padding prop.
    // (Would be nice to use something like styled-components for this instead)
    const divStyle = {
      display: "flex",
      marginBottom: margin + "px",
    };

    return allRows.map((row, index) => (
      <div className="grid-row" style={divStyle} key={"row_" + index}>
        {row}
      </div>
    ));
  }, [width, mediaDataToTag, media, margin, rowHeight]);

  return (
    <div
      className="grid-container"
      style={{
        userSelect: "none",
      }}
    >
      {rows}
    </div>
  );
};

export default Grid;
