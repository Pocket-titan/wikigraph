import G from "generatorics";
import _ from "lodash";
import { DependencyList, EffectCallback, useEffect, useRef } from "react";

export const isSingle = (obj: any[] | { [key: string]: any }) =>
  !(_.isPlainObject(obj) || _.isArray(obj)) ? false : Object.keys(obj).length === 1;

export const unwrap = (obj: object) => obj[Object.keys(obj)[0]];

export const unwrapIfSingle = (obj: any) => (isSingle(obj) ? unwrap(obj) : obj);

export const merge = (object: any, ...sources: any[]) => {
  return _.mergeWith(object, ...sources, (objValue, srcValue) => {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });
};

export const permutations = function* <T>(arr: T[], size = arr.length): Generator<T[]> {
  return yield* G.permutation(arr, size);
};

export const beautifyTitle = (title: string) => {
  const beautifulTitle = title.replace("Bestand:", "").split(".");

  if (beautifulTitle.length > 1) {
    beautifulTitle.splice(beautifulTitle.length - 1);
  }

  return beautifulTitle.join(".");
};

export function maybeResizeImage<T extends { src: string; width: number; height: number }>(
  image: T,
  { maxWidth, maxHeight }: { maxWidth: number; maxHeight: number }
): T & { resized?: { src: string; width: number; height: number } } {
  let resized = _.pick(image, ["src", "width", "height"]);

  if (resized.width > maxWidth || resized.height > maxHeight) {
    const [widthFactor, heightFactor] = [maxWidth / resized.width, maxHeight / resized.height];

    resized.width *= Math.min(widthFactor, heightFactor);
    resized.height *= Math.min(widthFactor, heightFactor);

    resized.width = Math.round(resized.width);
    resized.height = Math.round(resized.height);

    if (resized.src.includes("/commons/")) {
      const titlePart = resized.src.slice(resized.src.lastIndexOf("/") + 1);

      resized.src =
        resized.src.replace("/commons/", "/commons/thumb/") + `/${resized.width}px-${titlePart}`;

      if (resized.src.endsWith(".svg")) {
        resized.src = resized.src + ".png";
      }
    }

    return {
      ...image,
      resized,
    };
  }

  return image;
}

export function useEffectWithPrevious<T extends any[]>(
  fn: (prev: T) => ReturnType<EffectCallback>,
  deps: T = [] as any as T
) {
  const prev = useRef(deps);

  useEffect(() => {
    const result = fn(prev.current);
    prev.current = deps;
    return result;
  }, deps);
}

export function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function hslToHex(hsl: string) {
  let [h, s, l] = hsl
    .replace("hsl(", "")
    .replace(")", "")
    .replaceAll("%", "")
    .split(",")
    .map(Number);
  l /= 100;

  const a = (s * Math.min(l, 1 - l)) / 100;

  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };

  return `#${f(0)}${f(8)}${f(4)}`;
}
