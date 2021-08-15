import {
  batchKeys,
  CountDataLoaderKey,
  customCacheKeyFn,
  DataLoaderKey,
} from "@utils/dataloaderHelper";
import { QueryArgs } from "@utils/queryHelpers";
import DataLoader from "dataloader";
import objectHash from "object-hash";

export type CountQuery = {
  [fields: string]: any;
  count: number;
};

export type DataQuery = {
  [fields: string]: any;
  id: number;
};

export type DataLoadersStore = {
  [whereKey: string]: DataLoader<DataLoaderKey, any[] | any, unknown>;
};
export type CountDataLoadersStore = {
  [whereKey: string]: DataLoader<CountDataLoaderKey, any[] | any, unknown>;
};

/**
 * ParentProvider provides the infrastructure for matching
 * query results with the correct DataLoader input keys. This 
 * class can be extended by other child providers. Child providers
 * only have to implement the queries them self. The rest of the 
 * magic is handled by ParentProvider.
 */ 
export class ParentProvider {

  /********
   * Store dataloaders so they can be reused for the same
   * args.
   ********/
  dataLoaders;
  countDataLoaders;

  /**
   * Child passes up dataLoaders and countDataLoaders so that they
   * are stored in the child class instead of the parent. This prevents 
   * incorrect DataLoaders being used by different resolvers.
   */ 
  constructor({
    dataLoaders,
    countDataLoaders,
  }: {
    dataLoaders: DataLoadersStore;
    countDataLoaders: CountDataLoadersStore;
  }) {
    this.dataLoaders = dataLoaders;
    this.countDataLoaders = countDataLoaders;
  }

  /********
   * Manages dataloaders
   ********/

  /**
   * Args contain a where field that represents the WHERE sql clause.
   * Since each DataLoader can only represent on WHERE clause
   * (as SQL query is shared by all keys), we need separate DataLoader
   * for each where clause. In order to manage these DataLoader we use
   * the dataLoaders and countDataLoaders objects defined above.
   * dataLoaderManager creates individual DataLoader for each where clause
   * and ensures the same DataLoader is returned when a new query with the
   * same args comes in. This is achieved by giving DataLoader a key which
   * is based off of the ObjectHash of args.
   */
  dataLoaderManager(args: QueryArgs) {
    const filterKey = objectHash(args);
    if (!(filterKey in this.dataLoaders)) {
      this.dataLoaders[filterKey] = this.dataLoader(args);
    }
    return this.dataLoaders[filterKey];
  }

  /**
   * countDataLoaderManager does the same thing as dataLoaderManager
   * however instead of creating DataLoader that query the actual data,
   * these DataLoader query the total count of rows related to a WHERE
   * clause. (total count is a field in the user connection schema)
   */
  countDataLoaderManager(args: QueryArgs) {
    const filterKey = objectHash(args);
    if (!(filterKey in this.countDataLoaders)) {
      this.countDataLoaders[filterKey] = this.countDataLoader(args);
    }
    return this.countDataLoaders[filterKey];
  }

  /**
   * dataLoader is the actual DataLoader for the data. The DataLoader
   * batches DataLoaderKey keys into DataLoaderKey[] so that we only
   * have to make one query and can return data for many DataLoaderKeys.
   * Each DataLoaderKey is of format [field, value]. DataLoaderKey specifies
   * that we want to return rows where field = value for this key. We can
   * pass multiple DataLoaderKeys ([[field1, value1], [field2, value2]]) that
   * will return rows where field1 = value1 AND field2 = value2. To achieve this
   * for each unique DataLoaderKey we create a ObjectHash called partitionsKey.
   * partitionsKey is then used to assign query results to the correct key
   * (by creating a partitionsKey hash of the result fields). The query result
   * populates the grouped object with rows matching the input partitionsKey
   * (which is associated with a unique key).
   */
  dataLoader(args: QueryArgs) {
    return new DataLoader(
      async (keys: readonly DataLoaderKey[]) => {
        // So we can do `WHERE user_id IN (1,2,3,...) OR name IN ('Bob','Jon')`
        const batchedKeys = batchKeys(keys);
        const batchedKeysKeys = Object.keys(batchedKeys);

        // Data structure to help group data so we can return
        // rows in the correct order later. We will fill this
        // data structure later.
        const orderedPartitionKeys = [] as string[];
        const grouped = {} as { [partitionsKey: string]: any[] | any };

        // Populated the grouped with empty arrays for each partitionsKey.
        // These arrays will later be populated with the respective matching
        // rows.
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

        // Make query, sort the data into the grouped object.
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

  /**
   * Does the same thing as dataLoader() however this is
   * for total count. Requires a slightly different implementation
   * but does the same thing.
   */
  countDataLoader(args: QueryArgs) {
    return new DataLoader(
      async (partitions: readonly CountDataLoaderKey[]) => {
        const batchedKeys = batchKeys(partitions);
        const batchedKeysKeys = Object.keys(batchedKeys);

        // Same thing as dataLoader(). Populate grouped object with
        // key partitionsKey and value total count.
        const grouped = await this.countBatchFunction(args).then((res) => {
          return res.reduce((total, next) => {
            const partitionsKey = Object.keys(next)
              .filter((field) => batchedKeysKeys.includes(field))
              .sort()
              .map((field) => next[field]);
            total[objectHash(partitionsKey)] = next;
            return total;
          }, {} as { [partitionsKey: string]: CountQuery });
        });

        // Match CountDataLoaderKey with item in grouped. Same as dataLoader()
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

  /**
   * Function to override by child
   */
  batchFunction(_args: QueryArgs): Promise<DataQuery[]> {
    throw new Error("Method 'batchFunction()' must be implemented.");
  }

  countBatchFunction(_args: QueryArgs): Promise<CountQuery[]> {
    throw new Error("Method 'countBatchFunction()' must be implemented.");
  }
}
