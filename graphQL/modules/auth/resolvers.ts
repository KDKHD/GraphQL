import { signJWT } from "@root/passport/jwt";
import { users } from "@root/test/users";

export const resolvers = {
  Query:{
    signedInUser: async (_parent: any, _args: any, { user }: any) => {
      return user
    },
  },
  Mutation: {
    signInWithUsernameAndPassword: async (_parent: any, args: {username:String, password:String}, { res }: any) => {
      const user = users.accounts.find(user=> user.email == args.username && user.password == args.password)
      if(user){
        const token = await signJWT({user_id:user?.id})
        return {token:token}
    }
    },
  },
};
