import {
  arrSingle,
  arrToEdge,
  edgeItemToNode,
  OrderBy,
  SortDirection,
} from "@utils/dataloaderHelper";
import { OrderByType, Where } from "@utils/queryHelpers";
import { UsersProvider } from "./provider";

export const resolvers = {
  Query: {
    user: async (
      _parent: any,
      args: { user_id: string },
      { userInfo }: any,
      info: any
    ) => {
      return UsersProvider.usersDataLoaderManager({}, false)
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
      { userInfo }: any,
      info: any
    ) => {
      //await UsersProvider.usersCountDataLoaderManager({where:args.WHERE, partitionBy:["f_name"]}).load([["f_name", "Kenneth"]]).then(res=>console.log("HE",res))
      return {
        totalCount: UsersProvider.usersCountDataLoaderManager({where:args.WHERE, partitionBy:["f_name","l_name"]}).load([["f_name", "Kenneth"], ["l_name", "Kreindler"]]),
        edges: UsersProvider.usersDataLoaderManager({where:args.WHERE, after:args.AFTER, first: args.FIRST, order:args.ORDER,partitionBy:["f_name","l_name"], paginateFiled: "p_users.partition_value"}).load([["f_name", "Kenneth"],["l_name", "Kreindler"]]).then(arrToEdge),
      };
    },
  },
};
