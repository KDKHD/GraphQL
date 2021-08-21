import {
  arrToEdge,
  edgeItemToNode,
} from "@utils/dataloaderHelper";
import { OrderByType, Where } from "@utils/queryHelpers";
import { UsersProvider } from "./provider";

export const resolvers = {
  Query: {
    user: async (
      _parent: any,
      args: { user_id: string },
      _context: any,
      info: any
    ) => {
      const userProvider = new UsersProvider()

      return userProvider.dataLoaderManager({})
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
      const userProvider = new UsersProvider()
      return {
        totalCount: userProvider.countDataLoaderManager({
          where: args.WHERE,
        }).load([]),
        edges: userProvider.dataLoaderManager({
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
};
