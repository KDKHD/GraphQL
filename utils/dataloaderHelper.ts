import objectHash from "object-hash";

export type DataLoaderKey = string[][];
export type CountDataLoaderKey = string[][];
export type BatchedKeys = { [field: string]: Set<any> };
export type SortDirection = "ASC" | "DESC";
export type OrderBy = { [field: string]: SortDirection };

export const batchKeys = (args: readonly DataLoaderKey[]) => {
  const toReturn = {} as { [field: string]: Set<string> };
  args.forEach((dataLoaderKey) => {
    dataLoaderKey.forEach((item) => {
      const field = item[0];
      const value = item[1];
      if (!(item[0] in toReturn)) toReturn[field] = new Set();
      toReturn[field].add(value);
    });
  });
  return toReturn;
};

export const arrSingle = (args: any[]) => {
  if (args.length > 1) return args;
  return args?.[0];
};

export const arrToEdge = (args: { id: number }[]) => {
  return args.map((node) => edgeItemToNode(node));
};

export const edgeItemToNode = (node: { id?: number; [key: string]: any }) => {
  return {
    node,
    ...(node.id
      ? { cursor: Buffer.from(`${node.id}`).toString("base64") }
      : {}),
  };
};

export const customCacheKeyFn = (key: string[][]) => {
  return objectHash(
    key.sort((a, b) => {
      if (a[0] < b[0]) {
        return -1;
      } else {
        return 1;
      }
    })
  );
};
