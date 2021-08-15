import { Prisma, PrismaClient, users } from "@prisma/client";
import {
  afterLimit,
  prismaPartition,
  QueryArgs,
  selectCount,
  selectFields,
  whereGen,
} from "@utils/queryHelpers";
import { CountQuery, DataLoadersStore, ParentProvider } from "..";
import { CountDataLoadersStore } from "../parent";

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
  static dataLoaders = {} as DataLoadersStore;
  static countDataLoaders = {} as CountDataLoadersStore;

  constructor() {
    // Pass dataloader stores up to parent
    super({
      dataLoaders: UsersProvider.dataLoaders,
      countDataLoaders: UsersProvider.countDataLoaders,
    });
  }

  /**
   * Data batch function. Returns [partitionField1, partitionField2, ...other table fields]
   * 
   */
  batchFunction(args: QueryArgs) {
    return prisma.$queryRaw<users[]>(
      afterLimit(
        Prisma.sql`(SELECT * , Row_number() ${prismaPartition(
          args
        )} FROM users ${whereGen(args)}) AS p_users`,
        args
      )
    );
  }

  /**
   * Count batch function. Returns [partitionField1, partitionField2, ..., count][].
   * We must return the partitionFields so that we can match count with a specific 
   * key.
   */
  countBatchFunction(args: QueryArgs) {
    return prisma.$queryRaw<CountQuery[]>(
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
