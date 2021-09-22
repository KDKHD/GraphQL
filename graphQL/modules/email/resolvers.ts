import { users } from "@prisma/client";
import { arrToEdge, edgeItemToNode } from "@utils/dataloaderHelper";
import { OrderByType, QueryArgsType, Where } from "@utils/queryHelpers";
import graphqlFields from "graphql-fields";
import { EmailsProvider } from "./provider";

export const resolvers = {
  Query: {
    email: async (
      _parent: any,
      args: { email_id: string },
      { logged_in_user }: { logged_in_user: users },
      _info: any
    ) => {
      const emailsProvider = new EmailsProvider();

      return emailsProvider
        .dataLoaderManager({
          where: { user_id: { is: logged_in_user.user_id } },
          type: QueryArgsType.Query,
        })
        .load([["email_id", args.email_id]])
        .then(edgeItemToNode);
    },
    emails: async (
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
      const emailsProvider = new EmailsProvider();
      return {
        totalCount:
          topLevelFields.totalCount &&
          emailsProvider
            .countDataLoaderManager({
              where: {
                AND: [{ user_id: { is: logged_in_user.user_id } }, args.WHERE],
              },
              type: QueryArgsType.Query,
            })
            .load([]),
        edges:
          topLevelFields.edges &&
          emailsProvider
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
