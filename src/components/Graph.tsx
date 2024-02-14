import { useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import * as three from "three";
import type { DisplayGraph } from "ts/graph";
import { useStore } from "ts/hooks/useStore";
import { Html } from "@react-three/drei";
import { Bloom, EffectComposer, Outline } from "@react-three/postprocessing";
import { BlendFunction, Resizer, KernelSize } from "postprocessing";

const HoverInfo = ({
  vertex: { id, x, y, color, radius },
}: {
  vertex: { id: string; x: number; y: number; color: string; radius: number };
}) => (
  <Html position={[x + radius, y, 1]} distanceFactor={2} zIndexRange={[0, 100]}>
    <div
      style={{
        background: "white",
        padding: 3,
        borderRadius: 2,
        width: "100%",
        whiteSpace: "nowrap",
      }}
    >
      {id}
    </div>
  </Html>
);

const dummyObject = new three.Object3D();
const dummyColor = new three.Color();

const Graph = ({ graph: { vertices, edges } }: { graph: DisplayGraph }) => {
  const setClicked = useStore((state) => state.setClicked);
  const [hovered, setHovered] = useState<{ instanceId: number; id: string }>();
  const setCursor = useStore((state) => state.setCursor);
  const edgeGeometry = useRef<three.BufferGeometry>();
  const nodeMesh = useRef<three.InstancedMesh>();

  useLayoutEffect(() => {
    if (!nodeMesh.current) {
      return;
    }

    vertices.forEach((vertex, i) => {
      dummyObject.position.set(vertex.x, vertex.y, 1);
      dummyObject.scale.set(vertex.radius, vertex.radius, 1);
      dummyObject.updateMatrix();
      nodeMesh.current!.setMatrixAt(i, dummyObject.matrix);

      dummyColor.set(vertex.color);
      nodeMesh.current!.setColorAt(i, dummyColor);
    });

    nodeMesh.current.instanceMatrix.needsUpdate = true;
    nodeMesh.current.geometry.computeBoundingSphere();
  }, [vertices]);

  useLayoutEffect(() => {
    if (!edgeGeometry.current) {
      return;
    }

    edgeGeometry.current.setFromPoints(
      edges
        .map(({ from, to }) => [
          new three.Vector3(from.x, from.y, -1),
          new three.Vector3(to.x, to.y, -1),
        ])
        .flat(1)
    );

    edgeGeometry.current.computeBoundingSphere();
  }, [edges]);

  const { edgeColors } = useMemo(() => {
    const edgeColors = Float32Array.from(
      edges
        .map((edge, i) =>
          !hovered
            ? [
                [0.2, 0.6, 0.9],
                [0.7, 0.2, 0.1],
              ]
            : hovered.id !== edge.source && hovered.id !== edge.target
            ? [
                [0.086, 0.086, 0.11],
                [0.086, 0.086, 0.11],
              ]
            : [
                [0.7, 0, 0.1],
                [0, 0.9, 0.9],
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

  useEffect(() => {
    if (hovered !== undefined) {
      vertices.forEach((vertex, i) => {
        if (
          !(
            vertex.connections.links.includes(hovered.id) ||
            vertex.connections.backlinks.includes(hovered.id)
          )
        ) {
          setColor(i, "#404045");
        }
      });

      setColor(hovered.instanceId, "#f06");
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
        key={
          (vertices[0]?.id ??
            "0" + vertices.length + vertices[(vertices.length || 1) - 1]?.id ??
            "0" + edges[0]?.id ??
            "0" + edges.length + edges[(edges.length || 1) - 1]?.id ??
            "0") + "_nodes"
        }
        matrixAutoUpdate={false}
        ref={(ref) => void (nodeMesh.current = ref as any)}
        args={[null!, null!, vertices.length]}
        onPointerOver={({ instanceId }) => {
          setCursor("pointer");
        }}
        onPointerOut={({ instanceId }) => {
          if (instanceId === undefined) {
            return;
          }

          let vertex = vertices[instanceId];

          setColor(instanceId, vertex.color);
          setHovered(undefined);
          setCursor("grab");
        }}
        onPointerMove={({ instanceId }) => {
          if (instanceId === undefined) {
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
        onClick={(event) => {
          event.stopPropagation();

          if (event.instanceId === undefined) {
            return;
          }

          let vertex = vertices[event.instanceId];
          setClicked(vertex);
          setCursor("auto");
        }}
      >
        <circleGeometry args={[1, 30]} />
        <meshBasicMaterial />
      </instancedMesh>

      {hovered !== undefined && <HoverInfo vertex={vertices[hovered.instanceId]} />}
      <lineSegments matrixAutoUpdate={false}>
        <bufferGeometry ref={(ref) => void (edgeGeometry.current = ref as any)} attach="geometry">
          <bufferAttribute attach={"attributes-color"} args={[edgeColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          attach="material"
          vertexColors
          color="white"
          transparent
          opacity={0.3}
          linewidth={5}
        />
      </lineSegments>
    </>
  );
};

export default Graph;
