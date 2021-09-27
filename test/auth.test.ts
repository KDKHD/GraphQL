import { ApolloServer, ExpressContext, gql } from "apollo-server-express";
import express from "express";
import e from "express";
import initApolloServer from "../server";

const variables = {
  signUpWithPhonePhone: "+447411194149",
  verifyPhoneInitPhone: "+447411194149"
};
describe("Auth", () => {
  let apolloServer: ApolloServer<ExpressContext>;

  beforeAll(() => {
    const initServer = async () => {
      const { server } = await initApolloServer();
      apolloServer = server;
    };

    initServer();
  });

  describe("Phone sign up flow", () => {
    let token = ""

    it("signUpWithPhone", async () => {
      const signUpWithPhoneMutation = gql`
        mutation ($signUpWithPhonePhone: String!) {
          signUpWithPhone(phone: $signUpWithPhonePhone) {
            node {
              token
              user {
                node {
                  id
                }
              }
            }
          }
        }
      `;

      const res = await apolloServer.executeOperation(
        {
          query: signUpWithPhoneMutation,
          variables: { signUpWithPhonePhone: variables.signUpWithPhonePhone },
        },
        { req: {}} as unknown as ExpressContext
      );

      const jwtRegeX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/

      expect((res.data as any)?.signUpWithPhone?.node?.token).toMatch(jwtRegeX)
      token = (res.data as any)?.signUpWithPhone?.node?.token
    });

    it("signUpWithPhone", async () => {
      const signUpWithPhoneMutation = gql`
        mutation($verifyPhoneInitPhone: String!){
          verifyPhoneInit(phone: $verifyPhoneInitPhone) {
            to
          }
        }
      `;

      const res = await apolloServer.executeOperation(
        {
          query: signUpWithPhoneMutation,
          variables: { verifyPhoneInitPhone: variables.verifyPhoneInitPhone },
        },
        { req: {headers:{
          authorization: `Bearer ${token}`
        }} as express.Request} as unknown as ExpressContext
      );


      console.log(JSON.stringify(res, null, 2));

    });
  });
});
