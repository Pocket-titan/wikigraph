import Graph from "./graph";

describe("works", () => {
  it("layouts", () => {
    let vertices = ["a", "b", "c", "d"].map((id) => ({ id }));
    let edges = [
      ["a", "b"],
      ["a", "c"],
      ["a", "d"],
      ["d", "c"],
      ["c", "a"],
    ].map(([source, target]) => ({
      id: `${source}->${target}`,
      source,
      target,
      weight: 1,
    }));

    let graph = new Graph(vertices, edges).calculateDegrees().layout(["b"]);

    expect(
      graph.vertices.every(
        (vertex) => typeof vertex.x === "number" && typeof vertex.y === "number"
      ) &&
        graph.edges.every(
          (edge) =>
            typeof edge.from.x === "number" &&
            typeof edge.from.y === "number" &&
            typeof edge.to.x === "number" &&
            typeof edge.to.y === "number"
        )
    ).toBe(true);
  });
});
