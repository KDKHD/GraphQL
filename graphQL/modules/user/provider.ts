import { Prisma, PrismaClient } from "@prisma/client";
import {
  CountDataLoaderKey,
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
import { ParentProvider } from "../parent/provider";

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



export class UsersProvider extends ParentProvider {
  /**
   * Store reusable dataloader here
   */
  static dataLoaders = {} as {
    [whereKey: string]: DataLoader<DataLoaderKey, any[] | any, unknown>;
  };
  static countDataLoaders = {} as {
    [whereKey: string]: DataLoader<CountDataLoaderKey, any[] | any, unknown>;
  };

  constructor() {
    super({
      dataLoaders: UsersProvider.dataLoaders,
      countDataLoaders: UsersProvider.countDataLoaders,
    });
  }

  batchFunction(args: QueryArgs): Promise<any[]> {
    return prisma.$queryRaw(
      afterLimit(
        Prisma.sql`(SELECT * , Row_number() ${prismaPartition(
          args
        )} FROM users ${whereGen(args)}) AS p_users`,
        args
      )
    );
  }

  countBatchFunction(args: QueryArgs) {
    return prisma.$queryRaw(
      selectCount(
        Prisma.sql`(SELECT ${Prisma.join([
          ...selectFields(args.partitionBy), // select the partitioned fields
          Prisma.sql`COUNT(*) ${prismaPartition(args)}`, // select the count
        ])} FROM users ${whereGen(args)}) AS t1 GROUP BY ${
          args.partitionBy == undefined
            ? "1=1"
            : Prisma.join([...selectFields(args.partitionBy)])
        }`,
        args
      )
    );
  }
}
