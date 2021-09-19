import { Prisma, emails } from "@prisma/client";
import { prismaClient } from "@root/dbconnection/client";
import { bcryptHash, verifyHash } from "@utils/bcrypt";
import { sendEmailVerification } from "@utils/emailVerification";
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
export class EmailsProvider extends ParentProvider {
  /**
   * Store reusable dataloader here
   */

  static dataLoaders = {} as DataLoadersStore;
  static countDataLoaders = {} as CountDataLoadersStore;

  constructor() {
    // Pass dataloader stores up to parent
    super({
      dataLoaders: EmailsProvider.dataLoaders,
      countDataLoaders: EmailsProvider.countDataLoaders,
    });
  }

  /**
   * Data batch function. Returns [partitionField1, partitionField2, ...other table fields]
   *
   */
  batchFunction(args: QueryArgs) {
    return prismaClient.$queryRaw<emails[]>(
      afterLimit(
        Prisma.sql`(SELECT * , Row_number() ${prismaPartition(
          args
        )} FROM emails ${whereGen(args)}) AS p_emails`,
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
        ])} FROM emails ${whereGen(args)}) AS t1 GROUP BY ${
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

  static addEmail({ user_id, email }: { user_id: string; email: string }) {
    return prismaClient.emails.create({
      data: {
        user_id,
        email,
      },
    }).then(()=>sendEmailVerification({email}))
  }

  static updateEmailVerified({
    email,
    verified = true,
    user_id
  }: {
    email: string;
    verified: boolean;
    user_id: string
  }) {
    return prismaClient.emails.updateMany({
      where: {
        AND:[
          {email},
          {user_id}
        ]
      },
      data: {
        verified,
      },
    });
  }
}
