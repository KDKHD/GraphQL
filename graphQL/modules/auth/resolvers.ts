import { users } from "@prisma/client";
import { signJWT } from "@root/passport/jwt";
import { edgeItemToNode } from "@utils/dataloaderHelper";
import { QueryArgsType } from "@utils/queryHelpers";
import { UsersProvider } from "../user/provider";
import { AuthProvider } from "./provider";

export const resolvers = {
  Query: {
    signedInUser: async (
      _parent: any,
      _args: any,
      { logged_in_user }: { logged_in_user: users }
    ) => {
      return edgeItemToNode(logged_in_user);
    },
  },
  Mutation: {
    /**
     * Username Password
     */
    signUpWithUsernameAndPassword: async (
      _parent: any,
      args: {
        username: string;
        password: string;
        f_name?: string;
        l_name?: string;
        phone?: string;
        email?: string;
      },
      _context: any
    ) => {
      const user = await AuthProvider.signUpWithUsernameAndPassword(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
    signInWithUsernameAndPassword: async (
      _parent: any,
      args: {
        username: string;
        password: string;
      },
      _context: any
    ) => {
      const user = await AuthProvider.signInWithUsernameAndPassword(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user?.user_id });
      }
    },
    /**
     * Email Password
     */
    signUpWithEmailAndPassword: async (
      _parent: any,
      args: {
        username?: string;
        password: string;
        f_name?: string;
        l_name?: string;
        phone?: string;
        email: string;
      },
      _context: any
    ) => {
      const user = await AuthProvider.signUpWithEmailAndPassword(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
    signInWithEmailAndPassword: async (
      _parent: any,
      args: {
        email: string;
        password: string;
      },
      _context: any
    ) => {
      const user = await AuthProvider.signInWithEmailAndPassword(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user?.user_id });
      }
    },
    /**
     * Phone
     */
    signUpWithPhone: async (
      _parent: any,
      args: {
        username?: string;
        password?: string;
        f_name?: string;
        l_name?: string;
        phone: string;
        email?: string;
      },
      _context: any
    ) => {
      const user = await AuthProvider.signUpWithPhone(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
    verifyPhoneInit: async (
      _parent: any,
      args: {
        phone: string;
      },
      { logged_in_user }: { logged_in_user: users }
    ) => {
      // TODO: add check to be logged in. If you want to init a verification request you must be logged in
      const verification_check = await AuthProvider.verifyPhoneInit({
        phone: args.phone,
        user_id: logged_in_user.user_id
      });
      return {
        to: verification_check.to,
        status: verification_check.status,
      };
    },
    verifyPhone: async (
      _parent: any,
      args: {
        to: string;
        code: string;
      },
      { logged_in_user }: { logged_in_user: users }
    ) => {
      const user = await AuthProvider.verifyPhone({
        to: args.to,
        code: args.code,
        user_id: logged_in_user.user_id,
      });
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
    /**
     * Email
     */
    signUpWithEmail: async (
      _parent: any,
      args: {
        username?: string;
        password?: string;
        f_name?: string;
        l_name?: string;
        phone?: string;
        email: string;
      },
      _context: any
    ) => {
      const user = await AuthProvider.signUpWithEmail(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
    verifyEmailInit: async (
      _parent: any,
      args: {
        email: string;
      },
      { logged_in_user }: { logged_in_user: users }
    ) => {
      // TODO: add check to be logged in. If you want to init a verification request you must be logged in

      const verification_check = await AuthProvider.verifyEmailInit({
        email: args.email,
        user_id: logged_in_user.user_id
      });
      return {
        to: verification_check.to,
        status: verification_check.status,
      };
    },
    verifyEmail: async (
      _parent: any,
      args: {
        to: string;
        code: string;
      },
      { logged_in_user }: { logged_in_user: users }
    ) => {
      const user = await AuthProvider.verifyEmail({
        to: args.to,
        code: args.code,
        user_id: logged_in_user.user_id,
      });

      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
  },
  AuthNode: {
    user: async (parent: { user_id: string }, args: any, { res }: any) => {
      const userProvider = new UsersProvider();
      return userProvider
        .dataLoaderManager({ type: QueryArgsType.Query })
        .load([["user_id", parent.user_id]])
        .then(edgeItemToNode);
    },
  },
};
