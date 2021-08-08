import express from "express";
import { ApolloServer } from "apollo-server-express";
import { schema } from "./graphQL/modules";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/auth/auth";

dotenv.config();

export default async function startApolloServer() {
  const app = express();

  app.use("/graphql", authMiddleware);

  const server = new ApolloServer({
    schema: schema,
    context: ({ req, res }) => {
      return {
        res,
        req,
        user: (req as any).user,
      };
    },
    // @ts-expect-error: Ignore this type error
    playground: { settings: { "request.credentials": "include" } },
  });

  await server.start();

  server.applyMiddleware({ app });

  await new Promise((resolve) =>
    app.listen({ port: process.env.PORT }, resolve as () => void)
  );

  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`);

  return { server, app };
}
