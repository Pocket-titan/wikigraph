import React from "react";
import { Line } from "@react-three/drei";

const Link = ({
  from,
  to,
  lineWidth = 1,
  color = "white",
}: {
  from: [number, number];
  to: [number, number];
  lineWidth?: number;
  color?: string;
}) => {
  return (
    <Line
      matrixAutoUpdate={false}
      points={[
        [...from, -1],
        [...to, -1],
      ]}
      color={color}
      lineWidth={lineWidth}
      vertexColors={[
        [0.2, 0.6, 0.9],
        [0.7, 0.2, 0.1],
      ]}
    />
  );
};

export default Link;
