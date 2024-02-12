import _ from "lodash";
import * as wiki from "./wiki";

jest.setTimeout(5000);

describe("working", () => {
  it("works", async () => {
    let titles = ["Paard (dier)", "Chinese literatuur"];

    let res = (
      await Promise.all(
        titles.map(async (title) => {
          let [links, backlinks] = await Promise.all([
            wiki.getLinks(title, "nl"),
            wiki.getBacklinks(title, "nl"),
          ]);

          return {
            title,
            links,
            backlinks,
          };
        })
      )
    ).reduce((obj, { title, links, backlinks }) => {
      obj[title] = {
        links,
        backlinks,
      };

      return obj;
    }, {});

    let solution = _.intersection(...Object.values(res).map(_.iteratee("backlinks")));

    expect(_.first(solution)).toBe("De reis naar het westen");
  });
});
