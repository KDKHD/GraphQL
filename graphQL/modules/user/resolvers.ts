import { users } from "@prisma/client";
import { arrToEdge, edgeItemToNode } from "@utils/dataloaderHelper";
import { OrderByType, QueryArgsType, Where } from "@utils/queryHelpers";
import { UsersProvider } from "./provider";

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
      const userProvider = new UsersProvider();
      return {
        totalCount: userProvider
          .countDataLoaderManager({
            where: args.WHERE,
            type: QueryArgsType.Query,
          })
          .load([]),
        edges: userProvider
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
      { logged_in_user }: { logged_in_user: users },
    ) => {
      const userProvider = new UsersProvider();

      return userProvider
        .mutateUser({
          where: { user_id: logged_in_user.user_id as string},
          data: args,
        })
        .then(edgeItemToNode);
    },
  },
};
