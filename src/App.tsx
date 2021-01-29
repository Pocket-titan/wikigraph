import React, { Suspense, useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "react-three-fiber";
import { Stats, TrackballControls } from "@react-three/drei";
import * as THREE from "three";
import _ from "lodash";

import Graph, { Id, Vertex, Edge, Degrees, Position } from "./ts/graph";
import { getLinks, getBacklinks } from "./ts/wiki";
import Node from "./components/Node";
import Link from "./components/Link";
import Input from "./components/Input";
import Pages from "components/Pages";

const makeVertex = (id: Id): Vertex => ({ id });

async function buildGraph(titles: string[]) {
  let { vertices, edges } = (
    await Promise.all(
      titles.map(async (title) => {
        let [links, backlinks] = await Promise.all([
          // getLinks(title),
          [],
          getBacklinks(title),
        ]);

        return {
          title,
          links,
          backlinks,
        };
      })
    )
  ).reduce(
    ({ vertices, edges }, { title, links, backlinks }) => ({
      vertices: [
        ...vertices,
        makeVertex(title),
        ...backlinks.map(makeVertex),
        // ...links.map(makeVertex),
      ],
      edges: [
        ...edges,
        ...backlinks.map((source) => ({
          id: `${source}->${title}`,
          source,
          target: title,
        })),
        // ...links.map((target) => ({
        //   id: `${title}->${target}`,
        //   source: title,
        //   target,
        // })),
      ],
    }),
    { vertices: [] as Vertex[], edges: [] as Edge[] }
  );

  let graph = new Graph(vertices, edges)
    .calculateDegrees()
    .filter((vertex) => vertex.degree > 1)
    .calculateDegrees()
    .map(
      (vertex) => {
        let radius = 5 + _.clamp(2 * vertex.degree, 0, 15);

        let color = titles.includes(vertex.id)
          ? "#ffc831"
          : vertex.id === titles[titles.length - 1]
          ? "#ee3f0a"
          : "#4adfd2";

        return {
          ...vertex,
          radius,
          color,
        } as Vertex & Degrees & { radius: number; color: string };
      },
      (edge, graph) => {
        let source = graph.getVertex(edge.source);
        let target = graph.getVertex(edge.target);

        let weight = 0.1 + Math.min(source.degree, target.degree) / 12;

        return {
          ...edge,
          weight,
        } as Edge & { weight: number };
      }
    )
    .layout(titles, { initialRadius: 1000 });

  return graph;
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : never;

type DisplayGraph = UnwrapPromise<ReturnType<typeof buildGraph>>;

const Scene = ({ graph }: { graph?: DisplayGraph }) => {
  return (
    <>
      <ambientLight color="#ffffff" intensity={0.1} />
      <hemisphereLight color="#ffffff" intensity={1.0} />
      {graph && (
        <>
          {graph.vertices.map(({ id, radius, color, x, y }) => (
            <Node key={id} label={id} radius={radius} color={color} position={[x, y]} />
          ))}
          {graph.edges.map(({ id, source, target, from, to, weight }) => (
            <Link
              key={id}
              from={[from.x, from.y]}
              to={[to.x, to.y]}
              lineWidth={0.35 + weight / 10}
            />
          ))}
        </>
      )}
    </>
  );
};

export type Data = {
  [key: string]: {
    in: number;
    out: number;
    degree: number;
  };
};

const App = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [graph, setGraph] = useState<DisplayGraph>();
  const [titles, setTitles] = useState<string[]>([]);
  const [data, setData] = useState<Data>();

  useEffect(() => {
    if (titles.length === 0) {
      return;
    }

    const main = async () => {
      let graph = await buildGraph(titles);
      setGraph(graph);
      setData(
        titles.reduce((obj, title) => {
          let vertex = graph.getVertex(title);

          obj[title] = {
            in: vertex?.inDegree || 0,
            out: vertex?.outDegree || 0,
            degree: vertex?.degree || 0,
          };

          return obj;
        }, {} as Data)
      );
    };

    main();
  }, [titles]);

  console.log(`graph`, graph);
  console.log(`titles`, titles);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          marginTop: 15,
        }}
      >
        <Input
          ref={inputRef}
          onResultClick={(result) => {
            if (titles.includes(result)) {
              return;
            }

            setTitles((oldTitles) => [...oldTitles, result]);
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          top: "9vh",
          left: 15,
        }}
      >
        <Pages
          pages={titles.map((title) => ({ title }))}
          data={data}
          removeTitle={(title) =>
            setTitles((oldTitles) => {
              let newTitles = _.pull([...oldTitles], title);
              return newTitles;
            })
          }
        />
      </div>
      <Canvas
        concurrent
        camera={{
          position: [0, 0, 32],
          near: 0.1,
          far: 64,
          zoom: 2,
        }}
        orthographic
        onClick={() => {
          inputRef.current?.blur();
        }}
        // invalidateFrameloop
      >
        <TrackballControls
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.MIDDLE,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
          noRotate
          panSpeed={10}
        />
        <Stats />
        <gridHelper />
        <axesHelper />
        <Suspense fallback={null}>
          <Scene graph={graph} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;
