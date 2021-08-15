import { Prisma, PrismaClient } from "@prisma/client";
import {
  batchKeys,
  CountDataLoaderKey,
  DataLoaderKey,
} from "@utils/dataloaderHelper";
import {
  afterLimit,
  prismaPartition,
  QueryArgs,
  whereGen,
} from "@utils/queryHelpers";
import DataLoader from "dataloader";
import objectHash from "object-hash";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
  ],
});

prisma.$on("query", async (e) => {
  console.log(`${e.query} ${e.params}`);
});

export class UsersProvider {
  static usersDataLoaders = {} as {
    [whereKey: string]: DataLoader<DataLoaderKey, any[] | any, unknown>;
  };
  static usersCountDataLoaders = {} as {
    [whereKey: string]: DataLoader<CountDataLoaderKey, any[] | any, unknown>;
  };

  /**
   * Creates individual dataloaders for each unique args
   */
  static usersDataLoaderManager = (args: QueryArgs, many: boolean = true) => {
    const filterKey = objectHash(args);
    if (!(filterKey in UsersProvider.usersDataLoaders))
      UsersProvider.usersDataLoaders[filterKey] = UsersProvider.usersDataLoader(
        args,
        many
      );
    return UsersProvider.usersDataLoaders[filterKey];
  };

  /**
   * The dataloader
   */
  static usersDataLoader = (args: QueryArgs, many: boolean) =>
    new DataLoader(
      async (keys: readonly DataLoaderKey[]) => {
        // So we can do `WHERE user_id IN (1,2,3,...) OR name IN ('Bob','Jon')`
        const batchedKeys = batchKeys(keys);

        // Data structure to help group data so we can return
        // data in the correct order later. We will fill this
        // ds later.
        const grouped = keys.reduce((total, [field, value]) => {
          if (!(field in total)) total[field] = {};
          if (!(value in total[field])) total[field][value] = many ? [] : null;
          return total;
        }, {} as { [field: string]: { [value in string | number]: any | any[] } });

        // These are the fields that are specified in `[[user_id]] IN (1,2,3,...)`
        const groupedKeys = Object.keys(grouped);

        // Make query, sort the data into the grouped ds
        await UsersProvider.usersBatchFunction({ ...args, batchedKeys }).then(
          (data) => {
            data.forEach((item) => {
              groupedKeys.forEach((key) => {
                const value = item[key];
                if (value in grouped[key])
                  many
                    ? grouped[key][value].push(item)
                    : (grouped[key][value] = item);
              });
            });
          }
        );

        // Return data in the same order as the original keys
        return keys.map(([field, value]) => grouped[field][value]);
      },
      { cacheKeyFn: (key) => objectHash(key) }
    );

  /**
   * Makes the query using all of the params
   */
  static usersBatchFunction = async (args: QueryArgs): Promise<any[]> => {
    return prisma.$queryRaw(
      afterLimit(
        Prisma.sql`(SELECT * , Row_number() ${prismaPartition(
          args
        )} FROM users ${whereGen(args)}) AS p_users`,
        args
      )
    );
  };

  /**
   * Creates individual dataloaders for each unique args
   */
  static usersCountDataLoaderManager = (args: QueryArgs) => {
    const filterKey = objectHash(args);
    if (!(filterKey in UsersProvider.usersCountDataLoaders))
      UsersProvider.usersCountDataLoaders[filterKey] =
        UsersProvider.usersCountDataLoader(args);
    return UsersProvider.usersCountDataLoaders[filterKey];
  };

  static usersCountDataLoader = (args: QueryArgs) =>
    new DataLoader(async (partitions: readonly CountDataLoaderKey[]) => {
      // Group by partition. {[hash(partition values)]:{count:number}}
      const grouped = await UsersProvider.usersBatchCountFunction(args).then(
        (res) => {
          return res.reduce((total, next) => {
            const partitionsKey = Object.keys(next)
              .filter((field) => field != "count")
              .sort()
              .map((field) => next[field]);
            total[objectHash(partitionsKey)] = next;
            return total;
          }, {});
        }
      );

      // Create partitionsKey from partition values. Use partitionsKey to get the correct count
      return partitions.map((partition) => {
        const pTemp = partition.reduce((total, next) => {
          total[next[0]] = next[1];
          return total;
        }, {} as { [field: string]: any });
        const partitionsKey = Object.keys(pTemp)
          .filter((field) => field != "count")
          .sort()
          .map((field) => pTemp[field])
          .filter((value) => value != undefined);
        return grouped[objectHash(partitionsKey)].count;
      });
    });

  static usersBatchCountFunction = async (args: QueryArgs): Promise<any[]> => {
    return prisma.$queryRaw`SELECT ${Prisma.join(
      [
        args.partitionBy == undefined
          ? Prisma.empty
          : Prisma.sql([
              `${args.partitionBy
                .map((item) => `MIN(${item}) as ${item}`)
                .join(", ")}`,
            ]),
        Prisma.sql`AVG(t1.partition_value)`,
      ].filter((item) => item != Prisma.empty)
    )} as count FROM (SELECT ${Prisma.join(
      [
        args.partitionBy == undefined
          ? Prisma.empty
          : Prisma.sql([`${args.partitionBy.join(", ")}`]),
        Prisma.sql`COUNT(*) ${prismaPartition(args)}`,
      ].filter((item) => item != Prisma.empty)
    )} FROM users ${whereGen(args)}) AS t1 GROUP BY ${
      args.partitionBy == undefined
        ? "1=1"
        : Prisma.sql([`${args.partitionBy.join(", ")}`])
    }`;
  };
}
