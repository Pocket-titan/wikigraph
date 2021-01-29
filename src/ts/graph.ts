import _ from "lodash";
import Chance from "chance";
const chance = new Chance();

export type Id = string;

export type Vertex = {
  id: Id;
};

export type Edge = {
  id: Id;
  source: Id;
  target: Id;
};

const getVertex = <T extends Vertex>(vertices: Map<Id, T>, id: Id) => vertices.get(id)!;

const setVertex = <T extends Vertex>(vertices: Map<Id, T>, vertex: T) =>
  void vertices.set(vertex.id, vertex);

const getEdge = <U extends Vertex>(edges: Map<Id, U>, id: Id) => edges.get(id)!;

const setEdge = <U extends Edge>(edges: Map<Id, U>, edge: U) =>
  void edges.set(edge.id, edge);

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
    f: (vertex: T & { [key: string]: any }, graph: this) => A,
    g?: (edge: U & { [key: string]: any }, graph: this) => B
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

  calculateDegrees(): Graph<T & Degrees, U> {
    let [vertices, edges] = [
      new Map<Id, T & Degrees>(this._vertices as any),
      new Map(this._edges),
    ];

    vertices.forEach((vertex) => {
      (["degree", "inDegree", "outDegree"] as const).forEach((key) => {
        vertex[key] = 0;
      });
    });

    edges.forEach((edge) => {
      let source = getVertex(vertices, edge.source);
      let target = getVertex(vertices, edge.target);

      source.outDegree += 1;
      source.degree += 1;
      target.inDegree += 1;
      target.degree += 1;
    });

    return new Graph<T & Degrees, U>(vertices, edges);
  }

  layout(
    titles: string[],
    {
      initialAngle = Math.PI * (3 - Math.sqrt(5)),
      initialRadius = 10,
    }: {
      initialAngle?: number;
      initialRadius?: number;
    } = {
      initialAngle: Math.PI * (3 - Math.sqrt(5)),
      initialRadius: 10,
    }
  ): T extends Degrees
    ? Graph<T & Position, U & { from: Position; to: Position }>
    : never {
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
      if (
        titles.filter((title) => title === edge.source || title === edge.target)
          .length !== 1
      ) {
        return;
      }

      let [titleVertex, me] = (titles.includes(edge.source)
        ? [edge.source, edge.target]
        : [edge.target, edge.source]
      ).map((x) => getVertex(vertices, x));

      if (!me.x && !me.y) {
        let [angle, radius] = [
          _.random(0, 2 * Math.PI),
          chance.normal({
            mean: initialRadius / 4 + (titleVertex.degree ** 2 / maxDegree ** 2) * 3,
            dev: 0.15,
          }) +
            me.inDegree / 2,
        ];

        me.x = titleVertex.x! + radius * Math.cos(angle);
        me.y = titleVertex.y! + radius * Math.sin(angle);
      }
    });

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

    return new Graph(
      vertices as Map<Id, T & Degrees & Position>,
      edges as Map<Id, U & { from: Position; to: Position }>
    ) as any;
  }
}

export default Graph;
