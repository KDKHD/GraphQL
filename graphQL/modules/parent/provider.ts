import { Prisma, PrismaClient } from "@prisma/client";
import {
  batchKeys,
  CountDataLoaderKey,
  customCacheKeyFn,
  DataLoaderKey,
} from "@utils/dataloaderHelper";
import {
  afterLimit,
  prismaPartition,
  QueryArgs,
  selectCount,
  selectFields,
  whereGen,
} from "@utils/queryHelpers";
import DataLoader from "dataloader";
import objectHash from "object-hash";

/********
 * Manages dataloaders
 ********/
export class ParentProvider {
  dataLoaders;
  countDataLoaders;

  constructor({
    dataLoaders,
    countDataLoaders,
  }: {
    dataLoaders: {
      [whereKey: string]: DataLoader<DataLoaderKey, any[] | any, unknown>;
    };
    countDataLoaders: {
      [whereKey: string]: DataLoader<CountDataLoaderKey, any[] | any, unknown>;
    };
  }) {
    this.dataLoaders = dataLoaders;
    this.countDataLoaders = countDataLoaders;
  }

  /********
   * Manages dataloaders
   ********/

  /**
   * Creates individual dataloaders for each unique args
   */
  usersDataLoaderManager(args: QueryArgs) {
    const filterKey = objectHash(args);
    if (!(filterKey in this.dataLoaders)) {
      this.dataLoaders[filterKey] = this.dataLoader(args);
    }
    return this.dataLoaders[filterKey];
  }

  /**
   * Creates individual count dataloaders for each unique args
   */
  usersCountDataLoaderManager(args: QueryArgs) {
    const filterKey = objectHash(args);
    if (!(filterKey in this.countDataLoaders)) {
      this.countDataLoaders[filterKey] = this.countDataLoader(args);
    }
    return this.countDataLoaders[filterKey];
  }

  dataLoader(args: QueryArgs) {
    return new DataLoader(
      async (keys: readonly DataLoaderKey[]) => {
        // So we can do `WHERE user_id IN (1,2,3,...) OR name IN ('Bob','Jon')`
        const batchedKeys = batchKeys(keys);
        const batchedKeysKeys = Object.keys(batchedKeys);

        // Data structure to help group data so we can return
        // data in the correct order later. We will fill this
        // ds later.
        const orderedPartitionKeys = [] as string[];
        const grouped = {} as { [partitionsKey: string]: any[] | any };

        keys.forEach((key) => {
          const kTemp = key.reduce((total, next) => {
            total[next[0]] = next[1];
            return total;
          }, {} as { [field: string]: any });
          const partitionsKey = Object.keys(kTemp)
            .sort()
            .map((item) => kTemp[item]);
          grouped[objectHash(partitionsKey)] = [];
          orderedPartitionKeys.push(objectHash(partitionsKey));
        });

        // Make query, sort the data into the grouped ds
        await this.batchFunction({ ...args, batchedKeys }).then((data) => {
          data.forEach((item) => {
            const tempPartitionsKey = Object.keys(item)
              .sort()
              .filter((field) => batchedKeysKeys.includes(field))
              .map((field) => item[field]);
            const tempPartitionsKeyHash = objectHash(tempPartitionsKey);
            if (tempPartitionsKeyHash in grouped) {
              if (args.many) grouped[tempPartitionsKeyHash].push(item);
              else grouped[tempPartitionsKeyHash] = item;
            }
          });
        });

        // Return data in the same order as the original keys
        return orderedPartitionKeys.map(
          (partitionsKey) => grouped[partitionsKey]
        );
      },
      { cacheKeyFn: (key) => customCacheKeyFn(key) }
    );
  }

  batchFunction(args: QueryArgs): Promise<any[]> {
    throw new Error("Method 'batchFunction()' must be implemented.");
  }

  countDataLoader(args: QueryArgs) {
    return new DataLoader(
      async (partitions: readonly CountDataLoaderKey[]) => {
        const batchedKeys = batchKeys(partitions);
        const batchedKeysKeys = Object.keys(batchedKeys);

        // Group by partition. {[hash(partition values)]:{count:number}}
        const grouped = await this.countBatchFunction(args).then((res) => {
          return res.reduce((total, next) => {
            const partitionsKey = Object.keys(next)
              .filter((field) => batchedKeysKeys.includes(field))
              .sort()
              .map((field) => next[field]);
            total[objectHash(partitionsKey)] = next;
            return total;
          }, {});
        });

        // Create partitionsKey from partition values. Use partitionsKey to get the correct count
        return partitions.map((partition) => {
          const pTemp = partition.reduce((total, next) => {
            total[next[0]] = next[1];
            return total;
          }, {} as { [field: string]: any });
          const partitionsKey = Object.keys(pTemp)
            .filter((field) => batchedKeysKeys.includes(field))
            .sort()
            .map((field) => pTemp[field])
            .filter((value) => value != undefined);
          return grouped[objectHash(partitionsKey)].count;
        });
      },
      { cacheKeyFn: (key) => customCacheKeyFn(key) }
    );
  }

  countBatchFunction(args: QueryArgs): Promise<any[]> {
    throw new Error("Method 'countBatchFunction()' must be implemented.");
  }
}
