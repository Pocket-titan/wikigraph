import G from "generatorics";
import _ from "lodash";

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
