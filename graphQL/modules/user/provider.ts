import { Prisma, users } from "@prisma/client";
import { prismaClient } from "@root/dbconnection/client";
import { bcryptHash } from "@utils/bcrypt";
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
import { CountDataLoadersStore } from "../parent";

interface customUsersUpdateManyMutationInput
  extends Prisma.usersUpdateInput {
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

    return prismaClient.users.update({
      data: {
        ...(data.username && { username: data.username }),
        ...(data.password && { password_hash: passwordHash }),
        ...(data.f_name && { f_name: data.f_name }),
        ...(data.l_name && { l_name: data.l_name }),
        ...(data.phone && { phone: data.phone, phone_verified: false }),
        ...(data.email && { email: data.email, email_verified: false }),
      },
      where,
    });
  }
}
