import { users } from "@prisma/client";
import { arrToEdge, edgeItemToNode } from "@utils/dataloaderHelper";
import { OrderByType, QueryArgsType, Where } from "@utils/queryHelpers";
import graphqlFields from "graphql-fields";
import { PhoneNumbersProvider } from "./provider";

export const resolvers = {
  Query: {
    phone_number: async (
      _parent: any,
      args: { phone_number_id: string },
      { logged_in_user }: { logged_in_user: users },
      _info: any
    ) => {
      const phoneNumbersProvider = new PhoneNumbersProvider();
      console.log(logged_in_user);
      return phoneNumbersProvider
        .dataLoaderManager({
          where: { user_id: { is: logged_in_user.user_id } },
          type: QueryArgsType.Query,
        })
        .load([["phone_number_id", args.phone_number_id]])
        .then(edgeItemToNode);
    },
    phone_numbers: async (
      _parent: any,
      args: {
        AFTER: string;
        FIRST: number;
        ORDER: OrderByType[];
        WHERE: Where;
      },
      { logged_in_user }: { logged_in_user: users },
      info: any
    ) => {
      const topLevelFields = graphqlFields(info);
      const phoneNumbersProvider = new PhoneNumbersProvider();
      return {
        totalCount:
          topLevelFields.totalCount &&
          phoneNumbersProvider
            .countDataLoaderManager({
                where: {
                    AND: [{ user_id: { is: logged_in_user.user_id } }, args.WHERE],
                  },
              type: QueryArgsType.Query,
            })
            .load([]),
        edges:
          topLevelFields.edges &&
          phoneNumbersProvider
            .dataLoaderManager({
              where: {
                AND: [{ user_id: { is: logged_in_user.user_id } }, args.WHERE],
              },
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
