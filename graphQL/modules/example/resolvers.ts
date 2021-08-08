
export const resolvers = {
  Query: {
    example: async (_parent: any, args: any, {userInfo}: any , info: any) => {
      return { hello: JSON.stringify(userInfo), userInfo };
    },
  },
  Mutation: {
    example: async (_parent: any, args: any, { userInfo }: any) => {
      return { hello: "Mutation Hello World" };
    },
  },
};
