import { signJWT } from "@root/passport/jwt";
import { edgeItemToNode } from "@utils/dataloaderHelper";
import { UsersProvider } from "../user/provider";
import { AuthProvider } from "./provider";

export const resolvers = {
  Query: {
    signedInUser: async (_parent: any, _args: any, { user }: any) => {
      return user;
    },
  },
  Mutation: {
    /**
     * Username Password
     */ 
    signUpWithUsernameAndPassword: async (
      _parent: any,
      args:{
        username: string;
        password: string;
        f_name?: string;
        l_name?: string;
        phone?: string;
        email?: string;
      },
      { res }: any
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
      { res }: any
    ) => {
      const user = await AuthProvider.signInWithUsernameAndPassword(args);
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
      { res }: any
    ) => {
      const user = await AuthProvider.signUpWithPhone(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
    signInWithPhoneInit: async (
      _parent: any,
      args: {
        phone: string;
      },
      { res }: any
    ) => {
      const verification_check = await AuthProvider.signInWithPhoneInit(args);
      return {
        to: verification_check.to,
        status: verification_check.status
      }
    },
    signInWithPhone: async (
      _parent: any,
      args: {
        to: string;
        code: string
      },
      { res }: any
    ) => {
      const user = await AuthProvider.signInWithPhone(args);
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
      { res }: any
    ) => {
      const user = await AuthProvider.signUpWithEmail(args);
      if (user) {
        const token = await signJWT({ user_id: user.user_id });
        return edgeItemToNode({ token: token, user_id: user.user_id });
      }
    },
    signInWithEmailInit: async (
      _parent: any,
      args: {
        email: string;
      },
      { res }: any
    ) => {
      const verification_check = await AuthProvider.signInWithEmailInit(args);
      return {
        to: verification_check.to,
        status: verification_check.status
      }
    },
    signInWithEmail: async (
      _parent: any,
      args: {
        to: string;
        code: string
      },
      { res }: any
    ) => {
      const user = await AuthProvider.signInWithEmail(args);
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
        .dataLoaderManager({})
        .load([["user_id", parent.user_id]])
        .then(edgeItemToNode);
    },
  },
};
