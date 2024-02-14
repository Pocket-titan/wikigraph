import _ from "lodash";
import * as three from "three";
import Chance from "chance";
import { getLinks, getBacklinks, Language } from "./wiki";
import { hslToHex, random } from "./utils";
const chance = new Chance();

export type Id = string;

export type Vertex = {
  id: Id;
};

export type Edge = {
  id: Id;
  source: Id;
  target: Id;
  weight: number;
};

export type Connections = {
  connections: {
    links: Id[];
    backlinks: Id[];
  };
};

const getVertex = <T extends Vertex>(vertices: Map<Id, T>, id: Id) => vertices.get(id)!;

const setVertex = <T extends Vertex>(vertices: Map<Id, T>, vertex: T) =>
  void vertices.set(vertex.id, vertex);

const getEdge = <U extends Vertex>(edges: Map<Id, U>, id: Id) => edges.get(id)!;

const setEdge = <U extends Edge>(edges: Map<Id, U>, edge: U) => void edges.set(edge.id, edge);

const firstVertex = <T extends Vertex>(vertices: Map<Id, T>) => {
  for (let key of vertices.keys()) {
    return getVertex(vertices, key);
  }
};

const getOtherVertex = <T extends Vertex, U extends Edge>(vertex: T, edge: U) => {
  return vertex.id === edge.source ? edge.target : edge.source;
};

const midpoint = <T extends Position>(...vertices: T[]) => {
  const midpoint = vertices
    .reduce((acc, vertex) => [acc[0] + vertex.x, acc[1] + vertex.y], [0, 0])
    .map((x) => x / vertices.length);
  return { x: midpoint[0], y: midpoint[1] };
};

export type Degrees = {
  degree: number;
  inDegree: number;
  outDegree: number;
};

export type Position = {
  x: number;
  y: number;
};

class Graph<T extends Vertex = Vertex, U extends Edge = Edge> {
  private _vertices = new Map<Id, T>();
  private _edges = new Map<Id, U>();

  get vertices() {
    return [...this._vertices.values()];
  }

  get edges() {
    return [...this._edges.values()];
  }

  getVertex(id: Id) {
    return getVertex(this._vertices, id);
  }

  toJSON() {
    return {
      vertices: this.vertices,
      edges: this.edges,
    };
  }

  constructor(vertices?: T[] | Map<Id, T>, edges?: U[] | Map<Id, U>) {
    if (vertices) {
      if (vertices instanceof Map) {
        this._vertices = vertices;
      } else {
        for (let i = 0; i < vertices.length; i++) {
          let vertex = vertices[i];
          this._vertices.set(vertex.id, vertex);
        }
      }
    }

    if (edges) {
      if (edges instanceof Map) {
        this._edges = edges;
      } else {
        for (let i = 0; i < edges.length; i++) {
          let edge = edges[i];
          this._edges.set(edge.id, edge);
        }
      }
    }
  }

  map<A extends Vertex, B extends Edge = U>(
    f: (vertex: T, graph: this) => A,
    g?: (edge: U, graph: this) => B
  ) {
    let [vertices, edges] = [new Map(), new Map()];

    this._edges.forEach((edge) => {
      let source = getVertex(this._vertices, edge.source);
      let target = getVertex(this._vertices, edge.target);

      let newSource = f(source, this);
      let newTarget = f(target, this);
      setVertex(vertices, newSource);
      setVertex(vertices, newTarget);

      let newEdge = g ? g(edge, this) : edge;
      newEdge.source = newSource.id;
      newEdge.target = newTarget.id;
      setEdge(edges, newEdge);
    });

    return new Graph<A, B>(vertices, edges);
  }

  filter(predicate: (vertex: T) => boolean) {
    let [vertices, edges] = [new Map<Id, T>(), new Map<Id, U>()];

    this._edges.forEach((edge) => {
      let source = getVertex(this._vertices, edge.source);
      let target = getVertex(this._vertices, edge.target);

      let keepSource = predicate(source);
      let keepTarget = predicate(target);

      if (keepSource) {
        setVertex(vertices, source);
      }

      if (keepTarget) {
        setVertex(vertices, target);
      }

      if (keepSource && keepTarget) {
        setEdge(edges, edge);
      }
    });

    return new Graph(vertices, edges);
  }

  calculateDegrees(): Graph<T & Degrees & Connections, U> {
    let [vertices, edges] = [
      new Map<Id, T & Degrees & Connections>(this._vertices as any),
      new Map(this._edges),
    ];

    vertices.forEach((vertex) => {
      (["degree", "inDegree", "outDegree"] as const).forEach((key) => {
        vertex[key] = 0;
      });

      vertex.connections = { links: [], backlinks: [] };
    });

    edges.forEach((edge) => {
      let source = getVertex(vertices, edge.source);
      let target = getVertex(vertices, edge.target);

      source.outDegree += 1;
      source.degree += 1;
      target.inDegree += 1;
      target.degree += 1;

      source.connections.links.push(target.id);
      target.connections.backlinks.push(source.id);
    });

    return new Graph<T & Degrees & Connections, U>(vertices, edges);
  }

  async layout(
    titles: string[],
    { initialAngle = (2 * Math.PI) / titles.length, initialRadius = 10 } = {
      initialAngle: (2 * Math.PI) / titles.length,
      initialRadius: 10,
    }
  ): Promise<
    T extends Degrees ? Graph<T & Position, U & { from: Position; to: Position }> : never
  > {
    let [vertices, edges] = [
      new Map<Id, T & Degrees & Partial<Position>>(this._vertices as any),
      new Map<Id, U & Partial<{ from: Position; to: Position }>>(this._edges),
    ];

    if (vertices.size === 0) {
      return this as any;
    }

    if (!firstVertex(vertices)?.degree) {
      throw new Error();
    }

    let maxDegree = 0;
    let i = 0;

    // Position the title vertices first
    vertices.forEach((vertex) => {
      if (vertex.degree > maxDegree) {
        maxDegree = vertex.degree;
      }

      if (titles.includes(vertex.id)) {
        let [angle, radius] = [initialAngle * i, initialRadius * Math.sqrt(0.5 + i)];

        vertex.x = radius * Math.cos(angle);
        vertex.y = radius * Math.sin(angle);
        i += 1;
      }
    });

    // Now all the title vertices have a position, we can use them to position the rest of the nodes
    vertices.forEach((vertex) => {
      if (titles.includes(vertex.id)) {
        return;
      }

      const titleLinks = titles
        .map(
          (title) =>
            (edges.get(`${vertex.id}->${title}`) || edges.get(`${title}->${vertex.id}`)) && title
        )
        .filter((edge) => edge !== undefined) as string[];

      if (titleLinks.length === 0) {
        return;
      }

      const center = midpoint(...titleLinks.map((title) => vertices.get(title)! as Position));
      const centerDegree = titleLinks.length === 1 ? vertices.get(titleLinks[0])!.degree : 1;

      const angle = _.random(0, 2 * Math.PI);
      const mean =
        (initialRadius / 4 + (centerDegree ** 2 / maxDegree ** 2) * 3) /
        Math.max(1, Math.min(4, titleLinks.length));
      const radius =
        chance.normal({
          mean,
          dev: mean / (titleLinks.length === 1 ? 6 : 10),
        }) +
        vertex.inDegree / 2;

      vertex.x = center.x + radius * Math.cos(angle);
      vertex.y = center.y + radius * Math.sin(angle);
    });

    // Force layout
    if (vertices.size <= 5000) {
      let minDegree = {
        1: 0,
        2: 0,
        3: 1,
        4: 1,
        5: 2,
        6: 2,
        7: 3,
        8: 3,
      }[titles.length];
      if (minDegree === undefined) {
        minDegree = 4;
      }
      const n_iterations = 5;
      const k = 1;
      const dr_max = 10;

      for (let i = 0; i < n_iterations; i++) {
        // Add a little repulsion
        vertices.forEach((vertex) => {
          if (titles.includes(vertex.id) || vertex.degree <= minDegree!) {
            return;
          }

          let [dx, dy] = [0, 0];

          vertices.forEach((other) => {
            if (vertex.id === other.id || other.degree <= minDegree!) {
              return;
            }

            let [dx_, dy_] = [vertex.x! - other.x!, vertex.y! - other.y!];

            let xsign = Math.sign(dx_);
            let ysign = Math.sign(dy_);

            // Big force when they're too close, else normal
            const factor = Math.sqrt(dx_ ** 2 + dy_ ** 2) <= 5 ? 5 : 1;

            dx += Math.abs((other.degree ** (1 / 3) * k) / dx_ ** 2) * xsign * factor;
            dy += Math.abs((other.degree ** (1 / 3) * k) / dy_ ** 2) * ysign * factor;
          });

          vertex.x! += Math.sign(dx) * Math.min(Math.abs(dx), dr_max);
          vertex.y! += Math.sign(dy) * Math.min(Math.abs(dy), dr_max);
        });
      }
    }

    // Position the edges
    edges.forEach((edge) => {
      let source = vertices.get(edge.source)!;
      let target = vertices.get(edge.target)!;

      edge.from = { x: source.x!, y: source.y! };
      edge.to = { x: target.x!, y: target.y! };
    });

    return new Graph(
      vertices as Map<Id, T & Degrees & Position>,
      edges as Map<Id, U & { from: Position; to: Position }>
    ) as any;
  }
}

const makeVertex = (id: Id): Vertex => ({ id });

async function buildGraph(titles: string[], language: Language) {
  let { vertices, edges } = (
    await Promise.all(
      titles.map(async (title) => {
        let [links, backlinks] = await Promise.all([
          getLinks(title, language),
          // [],
          getBacklinks(title, language),
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
        ...links.map(makeVertex),
      ],
      edges: [
        ...edges,
        ...backlinks.map((source) => ({
          id: `${source}->${title}`,
          source,
          target: title,
          weight: 50,
        })),
        ...links.map((target) => ({
          id: `${title}->${target}`,
          source: title,
          target,
          weight: 0.1,
        })),
      ],
    }),
    { vertices: [] as Vertex[], edges: [] as Edge[] }
  );

  let graph = new Graph(vertices, edges).calculateDegrees();

  if (titles.length > 1) {
    let minDegree = {
      1: 1,
      2: 1,
      3: 1,
      4: 1,
      5: 2,
      6: 2,
      7: 3,
      8: 3,
    }[titles.length];
    if (minDegree === undefined) {
      minDegree = 4;
    }
    graph = graph.filter((vertex) => vertex.degree > minDegree!).calculateDegrees();
  }

  return await graph
    .map(
      (vertex) => {
        let radius = 5 + _.clamp(2 * vertex.degree, 0, 15);

        let color = titles.includes(vertex.id)
          ? vertex.id === titles[titles.length - 1]
            ? hslToHex("hsl(19, 60%, 50%)")
            : hslToHex("hsl(44, 92%, 53%)")
          : hslToHex(
              `hsl(${175 + random(-10, 10)}, ${30 + random(-10, 10)}%, ${50 + random(-5, 5)}%)`
            );

        return {
          ...vertex,
          radius,
          color,
        } as typeof vertex & { radius: number; color: string };
      },
      (edge, graph) => {
        let source = graph.getVertex(edge.source);
        let target = graph.getVertex(edge.target);

        let weight = edge.weight + (0.1 + Math.min(source.degree, target.degree));

        return {
          ...edge,
          weight,
        };
      }
    )
    .layout(titles, { initialRadius: 1000 });
}

export function computeBoundingSphere<T extends Position>(vertices: T[]) {
  const center = vertices.reduce((acc, coord) => [acc[0] + coord.x, acc[1] + coord.y], [0, 0]);
  const centroid = { x: center[0] / vertices.length, y: center[1] / vertices.length };

  const radius = vertices.reduce((maxDistance, coord) => {
    const distance = Math.sqrt(
      Math.pow(coord.x - centroid.x, 2) + Math.pow(coord.y - centroid.y, 2)
    );
    return Math.max(maxDistance, distance);
  }, 0);

  return new three.Sphere(new three.Vector3(centroid.x, centroid.y, 0), radius);
}

type UnwrapPromise<T> = T extends Promise<infer U> ? U : never;

type DisplayGraph = UnwrapPromise<ReturnType<typeof buildGraph>>;

export default Graph;
export { buildGraph };
export type { DisplayGraph };
