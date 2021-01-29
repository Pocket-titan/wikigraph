import React, { useState } from "react";
import { animated, useSpring } from "react-spring/three";
import { Html } from "@react-three/drei";

const Node = ({
  label,
  radius = 40,
  position = [0, 0],
  color: initialColor = "#4adfd2",
}: {
  label: string;
  radius?: number;
  position?: [number, number];
  color?: string;
}) => {
  const [hovered, setHovered] = useState(false);

  const { color } = useSpring({
    color: hovered ? "#ff0066" : initialColor,
  });

  return (
    <group
      position={[...position, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <mesh>
        <circleBufferGeometry attach="geometry" args={[radius, 40]} />
        <animated.meshStandardMaterial attach="material" color={color} />
      </mesh>
      {hovered && (
        <Html position={[radius, 0, 0]} scaleFactor={2} zIndexRange={[0, 100]}>
          <div style={{ background: "white", padding: 3, borderRadius: 2 }}>{label}</div>
        </Html>
      )}
    </group>
  );
};

export default Node;
