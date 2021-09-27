import express from "express";
import { ApolloServer } from "apollo-server-express";
import { schema } from "./graphQL/modules";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/auth/auth";
import { users } from "@prisma/client";
import { ApolloServerPluginInlineTrace, PluginDefinition } from "apollo-server-core";
require('module-alias/register')

dotenv.config();


export default async function initApolloServer() {
  const app = express();

  app.use("/graphql", authMiddleware);

  const server = new ApolloServer({
    schema: schema,
    context: ({ req, res }) => {
      return {
        res,
        req,
        logged_in_user: (req as any).user as users,
      };
    },
    plugins: [...(process.env.NODE_ENV != "production" ? [ApolloServerPluginInlineTrace()]:[])],
    
  });

  await server.start();

  server.applyMiddleware({ app });

  return { server, app };
}
