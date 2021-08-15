import { signJWT } from "@root/passport/jwt";
import { users } from "@root/test/users";
import { edgeItemToNode } from "@utils/dataloaderHelper";
import { UsersProvider } from "../user/provider";

export const resolvers = {
  Query: {
    signedInUser: async (_parent: any, _args: any, { user }: any) => {
      return user;
    },
  },
  Mutation: {
    signInWithUsernameAndPassword: async (
      _parent: any,
      args: { username: String; password: String },
      { res }: any
    ) => {
      const user = users.accounts.find(
        (user) => user.email == args.username && user.password == args.password
      );
      if (user) {
        const token = await signJWT({ user_id: user?.id });
        return edgeItemToNode({ token: token, user_id: user?.user_id });
      }
    },
    signUpWithUsernameAndPassword: async (
      _parent: any,
      args: { username: String; password: String },
      { res }: any
    ) => {
      const user = users.accounts.find(
        (user) => user.email == args.username && user.password == args.password
      );
      if (user) {
        const token = await signJWT({ user_id: user?.id });
        return { token: token };
      }
    },
  },
  AuthNode: {
    user: async (parent: { user_id: string }, args: any, { res }: any) => {
      const userProvider = new UsersProvider()
      return userProvider.dataLoaderManager({})
        .load([["user_id", parent.user_id]])
        .then(edgeItemToNode);
    },
  },
};
