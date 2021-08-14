import { arrSingle, arrToEdge, SortDirection } from "@utils/dataloaderHelper";
import { Where } from "@utils/queryHelpers";
import { UsersProvider } from "./provider";

export const resolvers = {
  Query: {
    user: async (
      _parent: any,
      args: { user_id: string },
      { userInfo }: any,
      info: any
    ) => {
      return {
        node: UsersProvider.usersDataLoaderManager({})
          .load(["user_id", args.user_id])
          .then(arrSingle),
      };
    },
    users: async (
      _parent: any,
      args: {
        AFTER: string;
        FIRST: number;
        DIRECTION: SortDirection;
        WHERE: Where;
      },
      { userInfo }: any,
      info: any
    ) => {
      return {
        totalCount: UsersProvider.usersBatchCountFunction(args.WHERE),
        edges: UsersProvider.usersBatchFunction(args.WHERE).then(arrToEdge),
      };
    },
  },
};
