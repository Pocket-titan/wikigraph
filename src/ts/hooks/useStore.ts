import { create } from "zustand";
import { persist, StateStorage, createJSONStorage } from "zustand/middleware";
import produce, { Draft } from "immer";
import { immer } from "zustand/middleware/immer";
import type { Vertex, DisplayGraph } from "../graph";
import type { Language } from "ts/wiki";

type Data = {
  [key: string]: {
    in: number | string;
    out: number | string;
    degree: number | string;
  };
};

type Cursor = "grab" | "grabbing" | "pointer" | "auto";

const useStore = create<
  {
    language: Language;
    setLanguage: (language: Language) => void;
    titles: string[];
    setTitles: (titles: string[] | ((oldTitles: string[]) => string[])) => void;
    graph?: DisplayGraph;
    setGraph: (graph?: DisplayGraph) => void;
    data?: Data;
    setData: (data?: Data) => void;
    clicked?: Vertex;
    setClicked: (vertex?: Vertex) => void;
    cursor: Cursor;
    setCursor: (cursor: Cursor) => void;
  },
  [["zustand/immer", never]]
>(
  immer((set, get) => ({
    titles: [],
    language: "en",
    setLanguage: (language) => {
      console.log("setLanguage", language);
      set(() => ({ language }));
    },
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
    cursor: "auto",
    setCursor: (cursor) => {
      set(() => ({
        cursor,
      }));
    },
  }))
);

export { useStore };
export type { Data };
