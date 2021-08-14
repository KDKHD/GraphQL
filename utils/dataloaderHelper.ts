export type DataLoaderKey = [string, any]
export type BatchedKeys = { [field: string]: any[] }
export type SortDirection = "ASC" | "DESC"
export const batchKeys = (args: readonly DataLoaderKey[]) => {
  return args.reduce((total, next) => {
    if (next.length != 2)
      throw new Error("Keys must be of type [string, any].");
    const [field, value] = next;
    if (!(field in total)) total[field] = [];
    total[field].push(value);
    return total;
  }, {} as BatchedKeys);
};

export const arrSingle = (args:any[]) => {
    if(args.length>1) return args
    return args?.[0]
}

export const arrToEdge = (args:{id:number}[]) => {
    return args.map(node=>({node, cursor:Buffer.from(`${node.id}`).toString('base64')}))
}