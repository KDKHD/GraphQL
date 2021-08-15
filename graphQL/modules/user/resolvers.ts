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
      { userInfo }: any,
      info: any
    ) => {
      const userProvider = new UsersProvider()

      return userProvider.usersDataLoaderManager({})
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
      const userProvider = new UsersProvider()
      //await UsersProvider.usersCountDataLoaderManager({where:args.WHERE, partitionBy:["f_name"]}).load([["f_name", "Kenneth"]]).then(res=>console.log("HE",res))
      return {
        totalCount: userProvider.usersCountDataLoaderManager({
          where: args.WHERE,
          partitionBy: ["f_name"],
        }).load([["f_name", "Kenneth"]]),
        edges: userProvider.usersDataLoaderManager({
          where: args.WHERE,
          after: args.AFTER,
          first: args.FIRST,
          order: args.ORDER,
          partitionBy: ["f_name"],
          paginateFiled: "p_users.partition_value",
          many: true,
        })
          .load([["f_name", "Kenneth"]])
          .then(arrToEdge),
      };
    },
  },
};
