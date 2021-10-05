import { Prisma, emails } from "@prisma/client";
import { prismaClient } from "@root/dbconnection/client";
import { bcryptHash, verifyHash } from "@utils/bcrypt";
import { sendEmailVerification } from "@utils/emailVerification";
import {
  afterLimit,
  prismaPartition,
  QueryArgs,
  QueryArgsType,
  selectCount,
  selectFields,
  whereGen,
} from "@utils/queryHelpers";
import { passwordValidator } from "@validators/user";
import { UserInputError } from "apollo-server-core";
import { CountQuery, DataLoadersStore, ParentProvider } from "..";
import { AuthProvider } from "../auth/provider";
import { CountDataLoadersStore } from "../parent";

const MAX_USER_EMAIL = 1
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

   static async addEmail({
    user_id,
    email,
  }: {
    user_id: string;
    email: string;
  }) {
    const emailsProvider = new EmailsProvider();
    const emailRes = (await emailsProvider
      .dataLoaderManager({
        type: QueryArgsType.Query,
        many: false,
        where: {
          verified: { is: "true" },
        },
      }).clear([["email", email]])
      .load([["email", email]])) as emails;

    if (emailRes) {
      throw new UserInputError(`Email already exists.`);
    }

    // Make sure limit has not been reached (replace with countDataloader)
    const emailCount = await prismaClient.emails.count({
      where: {
        user_id,
      },
    });

    if (emailCount >= MAX_USER_EMAIL) {
      throw new UserInputError(
        `Maximum amount ofemails is ${MAX_USER_EMAIL}.`
      );
    }

    return prismaClient.emails
      .create({
        data: {
          user_id,
          email,
        },
      })
  }

  static async updateEmailVerified({
    email,
    verified = true,
    user_id
  }: {
    email: string;
    verified: boolean;
    user_id: string
  }) {
    const emailsProvider = new EmailsProvider();

    const emailRes = (await emailsProvider
      .dataLoaderManager({
        type: QueryArgsType.Query,
        many: false,
        where: {
          verified: { is: "true" },
        },
      }).clear([["email", email]])
      .load([["email", email]])) as emails;

    if (emailRes) {
      throw new UserInputError(`Email already exists.`);
    }

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
