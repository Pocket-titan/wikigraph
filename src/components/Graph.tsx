import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import * as three from "three";
import { useFrame, useUpdate } from "react-three-fiber";
import type { DisplayGraph } from "../App";
import { Html } from "@react-three/drei";
import { useSpring } from "react-spring";

const HoverInfo = ({
  vertex: { id, x, y, color, radius },
}: {
  vertex: { id: string; x: number; y: number; color: string; radius: number };
}) => (
  <Html position={[x + radius, y, 1]} scaleFactor={2} zIndexRange={[0, 100]}>
    <div style={{ background: "white", padding: 3, borderRadius: 2 }}>{id}</div>
  </Html>
);

const dummyObject = new three.Object3D();
const dummyColor = new three.Color();

const Graph = ({ graph: { vertices, edges } }: { graph: DisplayGraph }) => {
  const [hovered, setHovered] = useState<{ instanceId: number; id: string }>();
  const colorAttrib = useRef<three.BufferAttribute>();

  const nodeMesh = useUpdate<three.InstancedMesh>(
    (mesh) => {
      vertices.forEach((vertex, i) => {
        dummyObject.position.set(vertex.x, vertex.y, 0);
        dummyObject.scale.set(vertex.radius, vertex.radius, 1);
        dummyObject.updateMatrix();
        mesh.setMatrixAt(i, dummyObject.matrix);

        dummyColor.set(vertex.color);
        mesh.setColorAt(i, dummyColor);
      });
    },
    [vertices]
  );

  const edgeGeometry = useUpdate<three.BufferGeometry>(
    (geometry) => {
      geometry.setFromPoints(
        edges
          .map(({ from, to }) => [
            new three.Vector3(from.x, from.y, -1),
            new three.Vector3(to.x, to.y, -1),
          ])
          .flat(1)
      );

      geometry.computeBoundingSphere();
    },
    [edges]
  );

  const { edgeColors } = useMemo(() => {
    const edgeColors = Float32Array.from(
      edges
        .map((edge, i) =>
          hovered && hovered.id !== edge.source && hovered.id !== edge.target
            ? [
                [0.086, 0.086, 0.11],
                [0.086, 0.086, 0.11],
              ]
            : [
                [0.2, 0.6, 0.9],
                [0.7, 0.2, 0.1],
              ]
        )
        .flat(2)
    );

    return { edgeColors };
  }, [edges, hovered]);

  const setColor = useCallback(
    (id: number, color: three.Color | string) => {
      dummyColor.set(color);
      nodeMesh.current!.setColorAt(id, dummyColor);
      nodeMesh.current!.instanceColor!.needsUpdate = true;
    },
    [nodeMesh]
  );

  // const [{ color }, set] = useSpring(() => ({
  //   color: "#ffffff",
  //   config: {
  //     mass: 5,
  //     duration: 125,
  //   },
  // }));

  // useFrame(() => {
  //   if (hovered) {
  //     const d = color.interpolate((v) => v).getValue();
  //     console.log(`d`, d);
  //     dummyColor.set(d!);
  //     // dummyColor.toArray(nodeMesh.current!.instanceColor, hovered * 3);
  //     setColor(hovered, dummyColor);
  //     // colorAttrib.current!.needsUpdate = true;
  //   }
  // });

  useEffect(() => {
    if (hovered !== undefined) {
      vertices.forEach((vertex, i) => {
        if (!vertex.connections.includes(hovered.id)) {
          setColor(i, "#16161b");
        }
      });

      setColor(hovered.instanceId, "#f06");
      // set({
      //   // @ts-expect-error
      //   to: { color: "#f06" },
      //   from: { color: "#fff" },
      //   reset: true,
      // });
    } else {
      vertices.forEach((vertex, i) => {
        setColor(i, vertex.color);
      });
    }
  }, [hovered, setColor]);

  return (
    <>
      <instancedMesh
        // We set the `key` prop such that React recreates it everytime `vertices.length` changes,
        // this is because we can't increase the count of an InstancedMesh without recreating it
        key={vertices.length}
        ref={nodeMesh}
        args={[null!, null!, vertices.length]}
        onPointerOut={({ instanceId }) => {
          if (!instanceId) {
            return;
          }

          let vertex = vertices[instanceId];

          setColor(instanceId, vertex.color);
          setHovered(undefined);
        }}
        onPointerMove={({ instanceId }) => {
          if (!instanceId) {
            return;
          }

          let vertex = vertices[instanceId];

          if (hovered === undefined) {
            setHovered({ instanceId, id: vertex.id });
            return;
          }

          if (hovered.instanceId !== instanceId) {
            setColor(hovered.instanceId, vertex.color);
            setHovered({ instanceId, id: vertex.id });
          }
        }}
      >
        <circleBufferGeometry args={[1, 30]} />
        <meshBasicMaterial />
      </instancedMesh>
      {hovered !== undefined && <HoverInfo vertex={vertices[hovered.instanceId]} />}
      <lineSegments>
        <bufferGeometry ref={edgeGeometry} attach="geometry">
          <bufferAttribute
            ref={colorAttrib}
            attachObject={["attributes", "color"]}
            args={[edgeColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          attach="material"
          vertexColors
          color="white"
          transparent
          opacity={0.3}
          linewidth={0.5}
        />
      </lineSegments>

      {/* <primitive ref={nodeMesh} object={instancedNodeMesh} /> */}
      {/* <instancedMesh ref={nodeMesh} args={[null!, null!, 100000]}>
        <circleBufferGeometry args={[1, 30]} />
        <meshBasicMaterial />
      </instancedMesh> */}
      {/* <lineSegments args={[geom]}>
        <lineBasicMaterial color={"white"} linewidth={10} />
      </lineSegments> */}
      {/* </instancedMesh> */}
      {/* <instancedMesh ref={edgeMesh} args={[null!, null!, 10000]}>
        <meshLine
          attach="geometry"
          points={edges
            .map(({ from, to }) => [
              new three.Vector3(from.x, from.y, -1),
              new three.Vector3(to.x, to.y, -1),
            ])
            .flat(1)}
        ></meshLine>
        <meshLineMaterial attach="material" lineWidth={2} />
      </instancedMesh> */}
      {/* <group matrixAutoUpdate={false}>
        {edges.map((edge) => {
          return (
            <mesh>
              <meshLine
                attach="geometry"
                points={[
                  new three.Vector3(edge.from.x, edge.from.y, -1),
                  new three.Vector3(edge.to.x, edge.to.y, -1),
                ]}
              />
              <meshLineMaterial attach="material" lineWidth={0.5} />
            </mesh>
          );
        })}
      </group> */}
    </>
  );
};

export default Graph;
