import React, { Suspense, useState, useRef, useLayoutEffect, useEffect } from "react";
import { Canvas } from "react-three-fiber";
import { Stats, TrackballControls } from "@react-three/drei";
import * as THREE from "three";
import _ from "lodash";
import Graph, { Id, Vertex, Edge, Degrees } from "ts/graph";
import { getLinks, getBacklinks } from "ts/wiki";
import Input from "components/Input";
import Pages from "components/Pages";
import GraphView from "components/Graph";

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

  let graph = new Graph(vertices, edges).calculateDegrees();

  if (titles.length > 1) {
    graph = graph.filter((vertex) => vertex.degree > 1).calculateDegrees();
  }

  return graph
    .map(
      (vertex) => {
        let radius = 5 + _.clamp(2 * vertex.degree, 0, 15);

        let color = titles.includes(vertex.id)
          ? vertex.id === titles[titles.length - 1]
            ? "#f5540a"
            : "#f5ba17"
          : "#2dd4c7";

        return {
          ...vertex,
          radius,
          color,
        } as typeof vertex & { radius: number; color: string };
      },
      (edge, graph) => {
        let source = graph.getVertex(edge.source);
        let target = graph.getVertex(edge.target);

        let weight = 0.1 + Math.min(source.degree, target.degree) / 12;

        return {
          ...edge,
          weight,
        } as typeof edge & { weight: number };
      }
    )
    .layout(titles, { initialRadius: 1000 });
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : never;

export type DisplayGraph = UnwrapPromise<ReturnType<typeof buildGraph>>;

const Scene = ({ graph }: { graph?: DisplayGraph }) => {
  return (
    <>
      <ambientLight />
      <hemisphereLight color="#ffffff" intensity={1.0} />
      {/* <pointLight position={[0, 0, 15]} intensity={2.0} color="#ffffff" /> */}
      {graph && <GraphView graph={graph} />}
    </>
  );
};

export type Data = {
  [key: string]: {
    in: number | string;
    out: number | string;
    degree: number | string;
  };
};

const App = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [graph, setGraph] = useState<DisplayGraph>();
  const [titles, setTitles] = useState<string[]>([]);
  const [data, setData] = useState<Data>();

  useEffect(() => {
    if (titles.length === 0) {
      setGraph(undefined);
      return;
    }

    const main = async () => {
      let graph = await buildGraph(titles);
      setGraph(graph);
      setData(
        titles.reduce((obj, title) => {
          let vertex = graph.getVertex(title);

          obj[title] = {
            in: vertex?.inDegree ?? "?",
            out: vertex?.outDegree ?? "?",
            degree: vertex?.degree ?? "?",
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
          zIndex: 10,
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
        onCreated={({ gl }) => {
          gl.outputEncoding = THREE.sRGBEncoding;
        }}
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
