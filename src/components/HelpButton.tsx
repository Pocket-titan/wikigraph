import { Backdrop, Paper, Typography } from "@material-ui/core";
import { PropsWithChildren, useState } from "react";
import Modal from "./Modal";
import useWindowSize from "ts/hooks/useWindowSize";
import _ from "lodash";

const QuestionMark = ({ width, height }: { width?: number | string; height?: number | string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={width} height={height}>
    <title>Close</title>
    <path d="M80 160c0-35.3 28.7-64 64-64h32c35.3 0 64 28.7 64 64v3.6c0 21.8-11.1 42.1-29.4 53.8l-42.2 27.1c-25.2 16.2-40.4 44.1-40.4 74V320c0 17.7 14.3 32 32 32s32-14.3 32-32v-1.4c0-8.2 4.2-15.8 11-20.2l42.2-27.1c36.6-23.6 58.8-64.1 58.8-107.7V160c0-70.7-57.3-128-128-128H144C73.3 32 16 89.3 16 160c0 17.7 14.3 32 32 32s32-14.3 32-32zm80 320a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
  </svg>
);

const Special = ({ children }: PropsWithChildren) => {
  return (
    <span
      style={{
        fontWeight: 600,
        color: "hsl(182.14285714285717, 70.58823529411765%, 53.333333333333336%)",
      }}
    >
      {children}
    </span>
  );
};

const HelpButton = () => {
  const [open, setOpen] = useState(false);
  const { vw, vh } = useWindowSize();

  const width = _.clamp(70 * vw, 200, 1000);

  return (
    <>
      <div className="help" title="Help" onClick={() => setOpen(true)}>
        <div className="button">
          <QuestionMark width={27} height={27} />
        </div>
      </div>
      <Modal open={open} setOpen={setOpen}>
        <h1>What is this?</h1>

        <Typography
          style={{
            marginBottom: 24,
          }}
        >
          This is a tool for visualising links between Wikipedia pages. <em>However,</em> it is made
          specifically for creating{" "}
          <a
            className="colored-link"
            href="https://wikipic-fun.translate.goog/help/nl.html?_x_tr_sl=nl&_x_tr_tl=en&_x_tr_hl=en-US&_x_tr_pto=wapp"
            target="_blank"
            rel="noreferrer"
          >
            Wikipic puzzles
          </a>
          , which consist of a grid of 6 images. Those images are found on specific Wikipedia
          articles that you have to find. The goal is to find the one "mystery page" that connects
          all the images together: it will be the page that <Special>links</Special> to all of the
          other ones (the ones that contain the images).
          <br />
          <br />
          Start by typing in a page title. After selecting a page, you'll see a{" "}
          <Special>graph</Special> pop up, with the page <Special>node</Special> at the center,
          surrounded by all of the pages that it <Special>links</Special> to, or is linked{" "}
          <em>by</em> (we call those <Special>backlinks</Special>). You can click on any{" "}
          <Special>node</Special> to see the images contained on that page, and you can click on any
          of the images to find a list of the pages that contain that particular image (this is the
          "file usage" section on Wikipedia).
        </Typography>
      </Modal>
    </>
  );
};

export default HelpButton;
