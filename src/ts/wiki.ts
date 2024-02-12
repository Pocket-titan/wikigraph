import fetch from "cross-fetch";
import qs from "query-string";
import _ from "lodash";
import { unwrapIfSingle } from "./utils";

let props = [
  "categories",
  "categoryinfo",
  "cirrusbuilddoc",
  "cirruscompsuggestbuilddoc",
  "cirrusdoc",
  "contributors",
  "deletedrevisions",
  "duplicatefiles",
  "extlinks",
  "extracts",
  "fileusage",
  "globalusage",
  "imageinfo",
  "images",
  "info",
  "iwlinks",
  "langlinks",
  "links",
  "linkshere",
  "pageimages",
  "pageprops",
  "pageterms",
  "pageviews",
  "redirects",
  "revisions",
  "stashimageinfo",
  "templates",
  "transcludedin",
  "transcodestatus",
  "videoinfo",
  "wbentityusage",
  "flowinfo",
  "description",
  "mapdata",
] as const;

type Prop = (typeof props)[number];

let lists = [
  "abusefilters",
  "abuselog",
  "allcategories",
  "alldeletedrevisions",
  "allfileusages",
  "allimages",
  "alllinks",
  "allpages",
  "allredirects",
  "allrevisions",
  "alltransclusions",
  "allusers",
  "backlinks",
  "betafeatures",
  "blocks",
  "categorymembers",
  "centralnoticeactivecampaigns",
  "centralnoticelogs",
  "checkuser",
  "checkuserlog",
  "codecomments",
  "codepaths",
  "coderevisions",
  "codetags",
  "embeddedin",
  "extdistrepos",
  "exturlusage",
  "filearchive",
  "gadgetcategories",
  "gadgets",
  "globalallusers",
  "globalblocks",
  "globalgroups",
  "imageusage",
  "iwbacklinks",
  "langbacklinks",
  "linterrors",
  "logevents",
  "messagecollection",
  "mostviewed",
  "mystashedfiles",
  "pagepropnames",
  "pageswithprop",
  "prefixsearch",
  "protectedtitles",
  "querypage",
  "random",
  "recentchanges",
  "search",
  "tags",
  "threads",
  "usercontribs",
  "users",
  "watchlist",
  "watchlistraw",
  "wblistentityusage",
  "wikisets",
  "deletedrevs",
  "extdistbranches",
  "mmsites",
  "readinglistentries",
] as const;

type List = (typeof lists)[number];

let generator = [
  "allcategories",
  "alldeletedrevisions",
  "allfileusages",
  "allimages",
  "alllinks",
  "allpages",
  "allredirects",
  "allrevisions",
  "alltransclusions",
  "backlinks",
  "categories",
  "categorymembers",
  "deletedrevisions",
  "duplicatefiles",
  "embeddedin",
  "exturlusage",
  "fileusage",
  "images",
  "imageusage",
  "iwbacklinks",
  "langbacklinks",
  "links",
  "linkshere",
  "messagecollection",
  "mostviewed",
  "pageswithprop",
  "prefixsearch",
  "protectedtitles",
  "querypage",
  "random",
  "recentchanges",
  "redirects",
  "revisions",
  "search",
  "templates",
  "transcludedin",
  "watchlist",
  "watchlistraw",
  "wblistentityusage",
  "readinglistentries",
] as const;

type Generator = (typeof generator)[number];

export let languages = ["nl", "en", "fr", "de"] as const;

export type Language = (typeof languages)[number];

type Params = {
  titles?: string | string[];
  pageids?: number[];
  revids?: number[];
  prop?: Prop | Prop[];
  list?: List | List[];
  generator?: Generator | Generator[];
  iwurl?: boolean;
  redirects?: boolean | string;
  converttitles?: boolean;
  [key: string]: any;
};

function stringifyParams(params: { [key: string]: any }) {
  let parsed = _.mapValues(params, (value, key, obj) => {
    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === "boolean") {
      return value === true ? "" : undefined;
    }

    if (key === "minsize" || key === "maxsize") {
      return parseInt(value);
    }

    return value;
  });

  return qs.stringify(parsed, {
    arrayFormat: "separator",
    arrayFormatSeparator: "|",
  });
}

export async function request(params: Params = {}, language: Language) {
  const url =
    `https://${language}.wikipedia.org/w/api.php?` +
    stringifyParams({
      ...params,
      action: params.action || "query",
      format: "json",
      formatversion: 2,
      origin: "*",
      errorformat: "raw",
      utf8: true,
    });

  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    ...(typeof window === "undefined"
      ? {
          headers: {
            "User-Agent":
              "graph-builder (https://github.com/pocket-titan/; jelmargerritsen@gmail.com) wiki.ts",
          },
        }
      : {}),
  });

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  let json = await response.json();

  if (json.errors) {
    throw new Error(JSON.stringify(json, null, 2));
  }

  return json;
}

const getCustomLimits = (params: Params): string[] => {
  let keys = Object.entries(params)
    .filter(
      ([key, value]) =>
        (key === "limit" ||
          key.slice(1) === "limit" ||
          key.slice(2) === "limit" ||
          key.slice(3) === "limit") &&
        value !== "max" &&
        (typeof value === "number" ? value < 500 : true)
    )
    .map(([key, value]) => key);

  return keys;
};

async function batchRequest(
  params: Params,
  language: Language,
  results: any[] = []
): Promise<any[]> {
  let res = await request(params, language);
  results.push(res);

  if (res.continue) {
    let continueType = Object.keys(res.continue).filter((key) => key !== "continue")[0];
    let continueKey = res.continue[continueType];

    let prefixes = getCustomLimits(params).map((x) => x.replace("limit", ""));

    if (
      ![continueType.slice(0, 1), continueType.slice(0, 2), continueType.slice(0, 3)].some(
        (prefix) => prefixes.includes(prefix)
      )
    ) {
      return await batchRequest({ ...params, [continueType]: continueKey }, language, results);
    }
  }

  return unwrapIfSingle(
    results.flatMap((result) => unwrapIfSingle(_.isPlainObject(result) ? result.query : result))
  );
}

const Cache = new Map<string, string>();

export async function api(params: Params, language: Language): Promise<any> {
  let cacheKey = JSON.stringify({ params, language });

  if (Cache.has(cacheKey)) {
    try {
      return JSON.parse(Cache.get(cacheKey)!);
    } catch {}
  }

  let results = await batchRequest(params, language);
  Cache.set(cacheKey, JSON.stringify(results));
  return results;
}

type BlParams = Prefix<
  "bl",
  {
    title?: string;
    pageid?: number;
    namespace?: Namespace | Namespace[] | "*";
    dir?: "ascending" | "descending";
    filterredir?: "all" | "nonredirects" | "redirects";
    limit?: number | "max";
    redirect?: boolean;
  }
>;

type Namespace =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 90
  | 91
  | 92
  | 93
  | 100
  | 101
  | 102
  | 103
  | 104
  | 105
  | 106
  | 107
  | 486
  | 487
  | 828
  | 829
  | 1198
  | 1199
  | 2300
  | 2301
  | 2302
  | 2303
  | 2600
  | 5500
  | 5501;

type Parameters = {
  titles?: string[];
  pageids?: number[];
  prop?: Prop | Prop[];
  list?: List | List[];
  generator?:
    | "allpages"
    | "allimages"
    | "alllinks"
    | "linkshere"
    | "backlinks"
    | "links"
    | "search";
  redirects?: boolean;
  namespace?: Namespace;
  limit?: number | "max";
  show?: "redirect" | "!redirect" | ["redirect", "!redirect"];
  title?: string;
  pageid?: number | string;
  dir?: "ascending" | "descending";
  filterredir?: "all" | "nonredirects" | "redirects";
  redirect?: boolean;
  from?: string;
  to?: string;
  prefix?: string;
  sort?: "name" | "timestamp";
  start?: Date;
  end?: Date;
  minsize?: number;
  maxsize?: number;
};

type Prefix<A extends string, B extends { [key: string]: any }> = keyof B extends string
  ? {
      [K in keyof B as `${A}${K}`]: B[K];
    }
  : never;

type AllParams = {
  title?: string;
  pageid?: number;
  namespace?: Namespace | Namespace[] | "*";
  dir?: "ascending" | "descending";
  filterredir?: "all" | "nonredirects" | "redirects";
  limit?: number | "max";
  redirect?: boolean;
  prop?: ("pageid" | "title" | "redirect")[];
  show?: "redirect" | "!redirect" | ("redirect" | "!redirect")[];
};

export async function getLinks(title: string, language: Language): Promise<string[]> {
  let links = await api(
    {
      titles: title,
      generator: "links",
      gplnamespace: 0,
      gpllimit: "max",
    },
    language
  );

  return (_.isPlainObject(links) ? [links] : links)
    .filter((link) => !link.missing)
    .map(_.iteratee("title"));
}

export async function getBacklinks(title: string, language: Language): Promise<string[]> {
  // For some reason, blredirect: true does not work with list: 'backlinks',
  // but gblredirect: true with generator: 'backlinks' _does_, so we use the latter /shrug
  let backlinks = await api(
    {
      gbltitle: title,
      generator: "backlinks",
      gblnamespace: 0,
      gbllimit: "max",
      gblredirect: true,
    },
    language
  );

  return (!backlinks ? [] : _.isPlainObject(backlinks) ? [backlinks] : backlinks).map(
    _.iteratee("title")
  );
}

export async function search(query: string, language: Language): Promise<string[]> {
  console.log(`search called with language: ${language}`);

  let results: [string, string[], string[], string[]] = await api(
    {
      action: "opensearch",
      search: query,
      namespace: 0,
      limit: 5,
    },
    language
  );

  console.log(`search results: ${results}`);

  let [, titles, summaries, urls] = results;

  let pages = _.zip(titles, summaries, urls).map(([title, summary, url]) => ({
    title,
    summary,
    url,
  }));

  return pages.map(_.iteratee("title"));
}

const blockedFiles = [
  "Wiktionary-logo.svg",
  "Wikibooks-logo.svg",
  "Commons-logo.svg",
  "1rightarrow blue.svg",
  "Disambig-dark.svg",
  "Nuvola single chevron right.svg",
  "Portal.svg",
  "Crystal Clear app package network.png",
  "Internet-web-browser.svg",
  "Wikivoyage-Logo-v3-icon.svg",
  "Wikisource-logo.svg",
  "Wikinews-logo.svg",
  "Red pog.svg",
  "Esculaap4.svg",
  "Portal icon.svg",
  "Speakerlink.svg",
  "Brosen windrose nl.svg",
  "Question book-new.svg",
  "Symbol category class.svg",
  "Foodlogo2.svg",
  "Wikibooks-logo-en-noslogan.svg",
  "Semi-protection-shackle.svg",
];

function ignoreTheseImages({ title }: { title: string }) {
  if (
    blockedFiles.map((file) => "Bestand:" + file).includes(title) ||
    blockedFiles.map((file) => "File:" + file).includes(title)
  ) {
    return false;
  }

  if (title.startsWith("Bestand:P ") || title.startsWith("File:P ")) {
    return false;
  }

  if (title.endsWith("-icon.svg")) {
    return false;
  }

  if (title.endsWith("-logo.svg")) {
    return false;
  }

  return true;
}

export async function getImages(title: string, language: Language) {
  let results = await api(
    {
      titles: title,
      generator: "images",
      gimlimit: "max",
      prop: ["imageinfo", "info"],
      iilimit: "max",
      iiprop: [
        "url",
        "size",
        "canonicaltitle",
        "mime",
        "thumbmime",
        "user",
        "mediatype",
        "comment",
        "parsedcomment",
      ],
    },
    language
  );

  if (_.isPlainObject(results)) {
    results = [results];
  }

  return _.uniqBy(
    (results || [])
      .filter(ignoreTheseImages)
      .map((result: any) => ({
        ..._.omit(result, "imageinfo"),
        ...result.imageinfo[0],
      }))
      .filter((result) => result.width > 75 && result.height > 75),
    _.iteratee("url")
  );
}

export async function getFileUsage(
  title: string,
  language: Language
): Promise<{ title: string; url: string }[]> {
  let results = await api(
    {
      titles: title,
      prop: "globalusage",
      gusite: `${language}wiki`,
      gunamespace: 0,
      gulimit: "max",
      guprop: ["url"],
    },
    language
  );

  return results.globalusage;
}
