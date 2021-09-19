import { Prisma, phone_numbers } from "@prisma/client";
import { prismaClient } from "@root/dbconnection/client";
import { bcryptHash, verifyHash } from "@utils/bcrypt";
import { sendPhoneVerification } from "@utils/phoneVerification";
import {
  afterLimit,
  prismaPartition,
  QueryArgs,
  selectCount,
  selectFields,
  whereGen,
} from "@utils/queryHelpers";
import { passwordValidator } from "@validators/user";
import { CountQuery, DataLoadersStore, ParentProvider } from "..";
import { AuthProvider } from "../auth/provider";
import { CountDataLoadersStore } from "../parent";

/**
 * Emails Provider provides the data required by ParentProvider
 * to group results.
 */
export class PhoneNumbersProvider extends ParentProvider {
  /**
   * Store reusable dataloader here
   */

  static dataLoaders = {} as DataLoadersStore;
  static countDataLoaders = {} as CountDataLoadersStore;

  constructor() {
    // Pass dataloader stores up to parent
    super({
      dataLoaders: PhoneNumbersProvider.dataLoaders,
      countDataLoaders: PhoneNumbersProvider.countDataLoaders,
    });
  }

  /**
   * Data batch function. Returns [partitionField1, partitionField2, ...other table fields]
   *
   */
  batchFunction(args: QueryArgs) {
    return prismaClient.$queryRaw<phone_numbers[]>(
      afterLimit(
        Prisma.sql`(SELECT * , Row_number() ${prismaPartition(
          args
        )} FROM phone_numbers ${whereGen(args)}) AS p_phone_numbers`,
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
        ])} FROM phone_numbers ${whereGen(args)}) AS t1 GROUP BY ${
          args.partitionBy == undefined
            ? "1=1"
            : Prisma.join([...selectFields(args.partitionBy)])
        }`,
        args
      )
    );
  }

  /**
   * Other Functions
   */

  static addPhoneNumber({
    user_id,
    phone,
  }: {
    user_id: string;
    phone: string;
  }) {
    return prismaClient.phone_numbers.create({
      data: {
        user_id,
        phone,
      },
    }).then(()=>sendPhoneVerification({phone}))
  }

  static updatePhoneVerified({
    phone,
    verified = true,
    user_id,
  }: {
    phone: string;
    verified: boolean;
    user_id: string;
  }) {
    return prismaClient.phone_numbers.updateMany({
      where: {
        AND: [{ phone }, { user_id }],
      },
      data: {
        verified,
      },
    });
  }
}
