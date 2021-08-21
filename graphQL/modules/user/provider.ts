import { Prisma, users } from "@prisma/client";
import { prismaClient } from "@root/dbconnection/client";
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


/**
 * User Provider provides the data required by ParentProvider
 * to group results.
 */ 
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
    return prismaClient.$queryRaw<users[]>(
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
    return prismaClient.$queryRaw<CountQuery[]>(
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
