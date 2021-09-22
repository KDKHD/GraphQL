import { emails, phone_numbers, Prisma, users } from "@prisma/client";
import { prismaClient } from "@root/dbconnection/client";
import { bcryptHash, verifyHash } from "@utils/bcrypt";
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
import { EmailsProvider } from "../email/provider";
import { CountDataLoadersStore } from "../parent";
import { PhoneNumbersProvider } from "../phone_number/provider";

interface customUsersUpdateManyMutationInput extends Prisma.usersUpdateInput {
  password?: string;
}
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

  async mutateUser({
    where,
    data,
  }: {
    where: Prisma.usersWhereUniqueInput;
    data: customUsersUpdateManyMutationInput;
  }) {
    data.password != null &&
      passwordValidator
        .required()
        .validate(data.password, { abortEarly: false });

    const passwordHash =
      data.password != null ? await bcryptHash(data.password) : null;

    const user = await prismaClient.users.update({
      data: {
        ...(data.username && { username: data.username }),
        ...(data.password && { password_hash: passwordHash }),
        ...(data.f_name && { f_name: data.f_name }),
        ...(data.l_name && { l_name: data.l_name }),
      },
      where,
    });

    return user
  }

  /**
   * Other Functions
   */

  static findFirstUsers(args: Prisma.usersFindFirstArgs) {
    return prismaClient.users.findFirst(args);
  }

  static verifyPassword({
    user,
    password,
  }: {
    user: users | null;
    password: string;
  }): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (user && user.password_hash) {
        const hashMatch = await verifyHash({
          encrypted: user.password_hash,
          plainText: password,
        });
        resolve(hashMatch as boolean);
      } else {
        resolve(false);
      }
    });
  }

  static async getUserByEmail({ email }: { email: string }) {
    const emailsProvider = new EmailsProvider();
    const usersProvider = new UsersProvider();

    const emailRes = (await emailsProvider
      .dataLoaderManager({
        many: false,
      })
      .load([["email", email]])) as emails;

    return usersProvider
      .dataLoaderManager({
        many: false,
      })
      .load([["user_id", emailRes.user_id]]);
  }

  static async getUserByPhone({ phone }: { phone: string }) {
    const phoneNumbersProvider = new PhoneNumbersProvider();
    const usersProvider = new UsersProvider();
    const phoneRes = (await phoneNumbersProvider
      .dataLoaderManager({ many: false })
      .load([["phone", phone.replace(/\s/g, "")]])) as phone_numbers;

    return usersProvider
      .dataLoaderManager({
        many: false,
      })
      .load([["user_id", phoneRes.user_id]]);
  }
}
