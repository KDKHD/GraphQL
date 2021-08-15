export type DataLoaderKey = string[][];
export type CountDataLoaderKey = string[][];
export type BatchedKeys = { [field: string]: any[] };
export type SortDirection = "ASC" | "DESC";
export type OrderBy = { [field: string]: SortDirection };

export const batchKeys = (args: readonly DataLoaderKey[]) => {
  const toReturn = {} as { [field: string]: string[] };
  args.forEach((dataLoaderKey) => {
    dataLoaderKey.forEach((item) => {
      const field = item[0];
      const value = item[1];
      if (!(item[0] in toReturn)) toReturn[field] = [];
      toReturn[field].push(value);
    });
  });
  return toReturn;
};

export const arrSingle = (args: any[]) => {
  if (args.length > 1) return args;
  return args?.[0];
};

export const arrToEdge = (args: { partition_index: number }[]) => {
  return args.map((node) => edgeItemToNode(node));
};

export const edgeItemToNode = (node: { partition_index: number }) => {
  return {
    node,
    cursor: Buffer.from(`${node.partition_index}`).toString("base64"),
  };
};
