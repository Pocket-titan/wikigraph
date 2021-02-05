import React, { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "react-three-fiber";
import {
  Stats,
  TrackballControls,
  MapControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";
import * as three from "three";
import _ from "lodash";
import { buildGraph, DisplayGraph } from "ts/graph";
import { useStore, Data } from "ts/hooks/useStore";
import Input from "components/Input";
import Pages from "components/Pages";
import GraphView from "components/Graph";
import PageInfo from "components/PageInfo";
import type { TrackballControls as Trackball } from "three/examples/jsm/controls/TrackballControls";

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

const Controls = () => {
  const { camera, gl, invalidate } = useThree();
  const ref = useRef<any>();

  useFrame(() => ref.current!.update());

  useEffect(() => {
    ref.current.addEventListener("change", invalidate);
  }, []);

  return (
    <TrackballControls
      mouseButtons={{
        LEFT: three.MOUSE.PAN,
        MIDDLE: three.MOUSE.MIDDLE,
        RIGHT: three.MOUSE.ROTATE,
      }}
      noRotate
      panSpeed={15}
      ref={ref}
      args={[camera, gl.domElement]}
      dynamicDampingFactor={0.2}
      staticMoving={false}
    />
  );
};

const App = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { graph, titles, data, setGraph, setTitles, setData, clicked } = useStore();
  const controls = useRef<Trackball>();

  useEffect(() => {
    if (titles.length === 0) {
      setGraph(undefined);
      return;
    }

    const main = async () => {
      setData(
        !graph
          ? {}
          : titles.reduce((obj, title) => {
              let vertex = graph.getVertex(title);

              obj[title] = {
                in: vertex?.inDegree ?? "?",
                out: vertex?.outDegree ?? "?",
                degree: vertex?.degree ?? "?",
              };

              return obj;
            }, {} as Data)
      );

      let newGraph = await buildGraph(titles);

      setGraph(newGraph);
      setData(
        titles.reduce((obj, title) => {
          let vertex = newGraph.getVertex(title);

          obj[title] = {
            in: vertex?.inDegree ?? 0,
            out: vertex?.outDegree ?? 0,
            degree: vertex?.degree ?? 0,
          };

          return obj;
        }, {} as Data)
      );
    };

    main();
  }, [titles]);

  // console.log(`graph`, graph);
  // console.log(`titles`, titles);

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
      {clicked && <PageInfo title={clicked.id} />}
      <Canvas
        // invalidateFrameloop
        concurrent
        onCreated={({ gl, camera }) => {
          gl.outputEncoding = three.sRGBEncoding;
        }}
        onClick={(e) => {
          inputRef.current?.blur();
        }}
      >
        <OrthographicCamera
          makeDefault
          position={[0, 0, 32]}
          zoom={1}
          near={0}
          far={100}
        />
        <TrackballControls
          ref={controls}
          mouseButtons={{
            LEFT: three.MOUSE.PAN,
            MIDDLE: three.MOUSE.MIDDLE,
            RIGHT: three.MOUSE.ROTATE,
          }}
          // noRotate
          panSpeed={15}
        />
        {process.env.NODE_ENV === "development" && (
          <>
            <Stats />
            <gridHelper />
            <axesHelper />
          </>
        )}
        <Suspense fallback={null}>
          <Scene graph={graph} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default App;
