import create, { State, StateCreator } from "zustand";
import produce, { Draft } from "immer";
import { Vertex, DisplayGraph } from "../graph";

const immer = <T extends State>(
  config: StateCreator<T, (fn: (draft: Draft<T>) => void) => void>
): StateCreator<T> => (set, get, api) =>
  config((fn) => set(produce(fn) as (state: T) => T), get, api);

type Data = {
  [key: string]: {
    in: number | string;
    out: number | string;
    degree: number | string;
  };
};

const useStore = create<{
  titles: string[];
  graph?: DisplayGraph;
  data?: Data;
  setTitles: (titles: string[] | ((oldTitles: string[]) => string[])) => void;
  setGraph: (graph?: DisplayGraph) => void;
  setData: (data?: Data) => void;
  clicked?: Vertex;
  setClicked: (vertex?: Vertex) => void;
}>(
  immer((set, get) => ({
    titles: [],
    graph: undefined,
    data: undefined,
    setTitles: (titles) => {
      set(() => ({
        titles: typeof titles === "function" ? titles(get().titles) : titles,
      }));
    },
    setGraph: (graph) => {
      set(() => ({
        graph,
      }));
    },
    setData: (data) => {
      set(() => ({
        data,
      }));
    },
    clicked: undefined,
    setClicked: (vertex) => {
      set(() => ({
        clicked: vertex,
      }));
    },
  }))
);

export { useStore };
export type { Data };
