import { useState, useEffect } from "react";

const getSize = () => ({
  vw: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) / 100,
  vh: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) / 100,
});

const useWindowSize = () => {
  let [windowSize, setWindowSize] = useState(getSize());

  const handleResize = () => {
    setWindowSize(getSize());
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });

  return windowSize;
};

export default useWindowSize;
