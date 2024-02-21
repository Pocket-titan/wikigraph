import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Stats, OrthographicCamera } from "@react-three/drei";
import CameraControls from "camera-controls";
import { CameraControls as DreiCameraControls } from "@react-three/drei";
import * as three from "three";
import _ from "lodash";
import { QueryParamProvider, useQueryParams, StringParam, ArrayParam } from "use-query-params";
import { WindowHistoryAdapter } from "use-query-params/adapters/window";
import Graph, { buildGraph, computeBoundingSphere, DisplayGraph } from "ts/graph";
import { useStore, Data } from "ts/hooks/useStore";
import Input from "components/Input";
import Pages from "components/Pages";
import GraphView from "components/Graph";
import PageInfo from "components/PageInfo";
import LanguageToggle from "components/LanguageToggle";
import HelpButton from "components/HelpButton";
import "./App.css";
import { EffectComposer } from "@react-three/postprocessing";
import { Language } from "ts/wiki";
import { useEffectWithPrevious } from "ts/utils";

const Scene = ({ graph, titles }: { graph?: DisplayGraph; titles: string[] }) => {
  const controls = useThree().controls as unknown as CameraControls;

  useEffectWithPrevious(
    ([prevGraph]) => {
      if (!graph || !titles || titles.length === 0) {
        return;
      }

      if (prevGraph && prevGraph === graph) {
        return;
      }

      const sphere = computeBoundingSphere(graph.vertices);
      controls.fitToSphere(sphere, true);
    },
    [graph] as const
  );

  return (
    <>
      <ambientLight />
      <hemisphereLight color="#ffffff" intensity={1.0} />
      <pointLight position={[0, 0, 15]} intensity={2.0} color="#ffffff" />
      {graph && <GraphView graph={graph} />}
    </>
  );
};

const initialCameraPosition = new three.Vector3(0, 0, 32);

const App = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    graph,
    setGraph,
    data,
    setData,
    language,
    setLanguage,
    titles,
    setTitles,
    clicked,
    cursor,
    setCursor,
  } = useStore();
  const camera = useRef<three.OrthographicCamera>(null);
  const [params, setParams] = useQueryParams({
    language: StringParam,
    titles: ArrayParam,
  });

  useEffect(() => {
    if (params.language && params.language !== language) {
      setLanguage(params.language as Language);
    }

    if (params.titles && !_.isEqual(params.titles, titles)) {
      setTitles(params.titles as string[]);
    }
  }, []);

  useEffect(() => {
    setParams({ language, titles });
  }, [language, titles]);

  useEffectWithPrevious(
    ([prevLanguage]) => {
      if (_.isString(prevLanguage) && _.isString(language) && prevLanguage !== language) {
        setGraph(undefined);
        setTitles([]);
        setData({});
      }
    },
    [language] as const
  );

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

      let newGraph = await buildGraph(titles, language);

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
      <div className="ui-container">
        <div className="pages-container">
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

        <div className="search-container">
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

        <div className="toggle-container">
          <LanguageToggle />
        </div>

        <div className="help-container">
          <HelpButton />
        </div>
      </div>
      {clicked && (
        <PageInfo
          title={clicked.id}
          connections={
            graph ? graph.getVertex(clicked.id).connections : { links: [], backlinks: [] }
          }
        />
      )}
      <Canvas
        onCreated={({ gl }) => {
          gl.outputColorSpace = three.SRGBColorSpace;
        }}
        onClick={(e) => {
          inputRef.current?.blur();
          // e.stopPropagation();
        }}
        onPointerEnter={() => setCursor("grab")}
        // onPointerOut={() => setCursor("auto")}
        onPointerDown={() => setCursor("grabbing")}
        onPointerUp={() => setCursor("grab")}
        style={{ cursor }}
        eventPrefix="client"
      >
        <OrthographicCamera
          ref={camera}
          makeDefault
          position={initialCameraPosition}
          zoom={1}
          near={0}
          far={10000}
        />

        {process.env.NODE_ENV === "development" && (
          <>
            <Stats />
            <gridHelper />
            <axesHelper />
          </>
        )}
        <DreiCameraControls
          makeDefault
          // truckSpeed={2}
          polarRotateSpeed={0}
          azimuthRotateSpeed={0}
          // maxSpeed={10}
          dollySpeed={5}
          dollyToCursor={true}
          mouseButtons={{
            left: CameraControls.ACTION.TRUCK,
            middle: CameraControls.ACTION.NONE,
            right: CameraControls.ACTION.NONE,
            wheel: CameraControls.ACTION.ZOOM,
          }}
          touches={{
            one: CameraControls.ACTION.TOUCH_TRUCK,
            two: CameraControls.ACTION.TOUCH_ZOOM,
            three: CameraControls.ACTION.NONE,
          }}
          minZoom={0.1}
          maxZoom={5}
        />

        <Suspense fallback={null}>
          <Scene graph={graph} titles={titles} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default () => {
  return (
    <QueryParamProvider adapter={WindowHistoryAdapter}>
      <App />
    </QueryParamProvider>
  );
};
