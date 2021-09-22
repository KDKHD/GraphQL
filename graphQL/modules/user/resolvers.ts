import { users } from "@prisma/client";
import { arrToEdge, edgeItemToNode } from "@utils/dataloaderHelper";
import { OrderByType, QueryArgsType, Where } from "@utils/queryHelpers";
import { EmailsProvider } from "../email/provider";
import { PhoneNumbersProvider } from "../phone_number/provider";
import { UsersProvider } from "./provider";
import graphqlFields from 'graphql-fields';

export const resolvers = {
  Query: {
    user: async (
      _parent: any,
      args: { user_id: string },
      _context: any,
      info: any
    ) => {
      const userProvider = new UsersProvider();

      return userProvider
        .dataLoaderManager({ type: QueryArgsType.Query })
        .load([["user_id", args.user_id]])
        .then(edgeItemToNode);
    },
    users: async (
      _parent: any,
      args: {
        AFTER: string;
        FIRST: number;
        ORDER: OrderByType[];
        WHERE: Where;
      },
      _context: any,
      info: any
    ) => {
      const topLevelFields = graphqlFields(info);
      const userProvider = new UsersProvider();
      return {
        totalCount: topLevelFields.totalCount && userProvider
          .countDataLoaderManager({
            where: args.WHERE,
            type: QueryArgsType.Query,
          })
          .load([]),
        edges: topLevelFields.edges && userProvider
          .dataLoaderManager({
            where: args.WHERE,
            after: args.AFTER,
            first: args.FIRST,
            order: args.ORDER,
            many: true,
          })
          .load([])
          .then(arrToEdge),
      };
    },
  },
  Mutation: {
    user: async (
      _parent: any,
      args: {
        username?: string;
        password?: string;
        f_name?: string;
        l_name?: string;
        phone?: string;
        email?: string;
      },
      { logged_in_user }: { logged_in_user: users }
    ) => {
      const userProvider = new UsersProvider();

      return userProvider
        .mutateUser({
          where: { user_id: logged_in_user.user_id as string },
          data: args,
        })
        .then(edgeItemToNode);
    },
  },

  UserNode: {
    emails: async (parent: { user_id: string }, args: any, _context: any,
      info: any) => {
      const topLevelFields = graphqlFields(info);

      const emailsProvider = new EmailsProvider();
      return {
        totalCount: topLevelFields.totalCount && emailsProvider
          .countDataLoaderManager({
            where: args.WHERE,
            partitionBy: ["user_id"],
            type: QueryArgsType.Query,
            many: true,
          })
          .load([["user_id", parent.user_id]]),
        edges: topLevelFields.edges && emailsProvider
          .dataLoaderManager({
            where: args.WHERE,
            after: args.AFTER,
            first: args.FIRST,
            order: args.ORDER,
            partitionBy: ["user_id"],
            type: QueryArgsType.Query,
          })
          .load([["user_id", parent.user_id]])
          .then(edgeItemToNode),
      };
    },
    phone_numbers: async (
      parent: { user_id: string },
      args: any,
      _context: any,
      info: any
    ) => {
      const topLevelFields = graphqlFields(info);

      const phoneNumbersProvider = new PhoneNumbersProvider();
      return {
        totalCount: topLevelFields.totalCount && phoneNumbersProvider
          .countDataLoaderManager({
            where: args.WHERE,
            partitionBy: ["user_id"],
            type: QueryArgsType.Query,
            many: true,
          })
          .load([["user_id", parent.user_id]]),
        edges: topLevelFields.edges && phoneNumbersProvider
          .dataLoaderManager({
            where: args.WHERE,
            after: args.AFTER,
            first: args.FIRST,
            order: args.ORDER,
            partitionBy: ["user_id"],
            type: QueryArgsType.Query,
            many: true,
          })
          .load([["user_id", parent.user_id]])
          .then(arrToEdge),
      };
    },
  },
};
