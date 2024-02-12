import _ from "lodash";
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

  calculateDegrees(): Graph<T & Degrees & { connections: Id[] }, U> {
    let [vertices, edges] = [
      new Map<Id, T & Degrees & { connections: Id[] }>(this._vertices as any),
      new Map(this._edges),
    ];

    vertices.forEach((vertex) => {
      (["degree", "inDegree", "outDegree"] as const).forEach((key) => {
        vertex[key] = 0;
      });

      vertex.connections = [];
    });

    edges.forEach((edge) => {
      let source = getVertex(vertices, edge.source);
      let target = getVertex(vertices, edge.target);

      source.outDegree += 1;
      source.degree += 1;
      target.inDegree += 1;
      target.degree += 1;

      source.connections.push(target.id);
      target.connections.push(source.id);
    });

    return new Graph<T & Degrees & { connections: Id[] }, U>(vertices, edges);
  }

  forceLayout(
    titles: string[],
    { initialAngle = (2 * Math.PI) / titles.length, initialRadius = 10 } = {
      initialAngle: (2 * Math.PI) / titles.length,
      initialRadius: 10,
    }
  ): T extends Degrees ? Graph<T & Position, U & { from: Position; to: Position }> : never {
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

    return this as any;
  }

  layout(
    titles: string[],
    {
      // initialAngle = Math.PI * (3 - Math.sqrt(5)),
      initialAngle = (2 * Math.PI) / titles.length,
      initialRadius = 10,
    } = {
      // initialAngle: Math.PI * (3 - Math.sqrt(5)),
      initialAngle: (2 * Math.PI) / titles.length,
      initialRadius: 10,
    }
  ): T extends Degrees ? Graph<T & Position, U & { from: Position; to: Position }> : never {
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

    edges.forEach((edge) => {
      // We're basing the layout of our nodes on their first link to a titleVertex,
      // so bail out if we're dealing with none or only titleVertices
      if (titles.filter((title) => title === edge.source || title === edge.target).length !== 1) {
        return;
      }

      let [titleVertex, me] = (
        titles.includes(edge.source) ? [edge.source, edge.target] : [edge.target, edge.source]
      ).map((x) => getVertex(vertices, x));

      if (_.isUndefined(me.x) && _.isUndefined(me.y)) {
        const angle = _.random(0, 2 * Math.PI);
        const mean = initialRadius / 4 + (titleVertex.degree ** 2 / maxDegree ** 2) * 3;
        const radius =
          chance.normal({
            mean,
            dev: mean / 6,
          }) +
          me.inDegree / 2 +
          edge.weight * 10;

        me.x = titleVertex.x! + radius * Math.cos(angle);
        me.y = titleVertex.y! + radius * Math.sin(angle);
      }
    });

    // If there's still nodes without positions (can happen if they have no links to titleNodes,
    // for example), we still need to give 'em a position
    edges.forEach((edge) => {
      let source = getVertex(vertices, edge.source);
      let target = getVertex(vertices, edge.target);

      if (!source.x && !source.y) {
        source.x = _.random(-initialRadius, initialRadius, true);
        source.y = _.random(-initialRadius, initialRadius, true);
      }

      if (!target.x && !target.y) {
        target.x = _.random(-initialRadius, initialRadius, true);
        target.y = _.random(-initialRadius, initialRadius, true);
      }

      edge.from = { x: source.x!, y: source.y! };
      edge.to = { x: target.x!, y: target.y! };
    });

    const n_iterations = 50;
    const k = 0.1;
    const k2 = 0.01;

    const cs = [
      -4.56854966e-6, 1.15393731e-4, 3.21805999e-3, -8.41648908e-2, 4.72052812e-2, 4.99151898,
    ];

    for (let i = 0; i < n_iterations; i++) {
      vertices.forEach((vertex) => {
        if (titles.includes(vertex.id) || vertex.degree === 0) {
          return;
        }

        let [dx, dy] = [0, 0];

        vertices.forEach((other) => {
          if (vertex.id === other.id || other.degree === 0) {
            return;
          }

          let [dx_, dy_] = [vertex.x! - other.x!, vertex.y! - other.y!];

          let xsign = Math.sign(dx_);
          let ysign = Math.sign(dy_);

          const factor = Math.sqrt(dx_ ** 2 + dy_ ** 2) <= 5 ? 5 : 1;

          dx += Math.abs((other.degree ** (1 / 3) * k) / dx_ ** 2) * xsign * factor;
          dy += Math.abs((other.degree ** (1 / 3) * k) / dy_ ** 2) * ysign * factor;
        });

        vertex.x! += Math.sign(dx) * Math.min(Math.abs(dx), 10);
        vertex.y! += Math.sign(dy) * Math.min(Math.abs(dy), 10);
      });

      edges.forEach((edge) => {
        let source = vertices.get(edge.source)!;
        let target = vertices.get(edge.target)!;

        let [dx, dy] = [source.x! - target.x!, source.y! - target.y!];
        let r = Math.sqrt(dx ** 2 + dy ** 2);

        let xsign = Math.sign(dx);
        let ysign = Math.sign(dy);

        if (!titles.includes(edge.source)) {
          source.x! -= xsign * Math.abs(k2 * dx) * source.degree ** (1 / 3);
          source.y! -= ysign * Math.abs(k2 * dy) * source.degree ** (1 / 3);
        }

        if (!titles.includes(edge.target)) {
          target.x! += xsign * Math.abs(k2 * dx) * target.degree ** (1 / 3);
          target.y! += ysign * Math.abs(k2 * dy) * target.degree ** (1 / 3);
        }
      });
    }

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
    graph = graph.filter((vertex) => vertex.degree > 1).calculateDegrees();
  }

  return graph
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

type UnwrapPromise<T> = T extends Promise<infer U> ? U : never;

type DisplayGraph = UnwrapPromise<ReturnType<typeof buildGraph>>;

export default Graph;
export { buildGraph };
export type { DisplayGraph };
