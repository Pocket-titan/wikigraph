import React, { CSSProperties, useMemo } from "react";
import { animated, useTransition } from "@react-spring/web";

export const Fade = React.forwardRef<
  HTMLDivElement,
  {
    in: boolean;
    children?: React.ReactElement;
    onEnter?: () => void;
    onExited?: () => void;
    style?: CSSProperties;
  }
>(function Fade({ in: open, children, onEnter, onExited, style = {}, ...other }, ref) {
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

  const transitions = useTransition(open, spring);

  return transitions((_style, item) => {
    return (
      item && (
        <animated.div
          className="fade"
          style={{ ...style, ..._style, outline: "none", zIndex: 10 }}
          {...other}
        >
          {children}
        </animated.div>
      )
    );
  });
});
