import initApolloServer from "./server";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;

(async () => {
  const { app, server } = await initApolloServer();

  await new Promise((resolve) =>
    app.listen({ port: PORT }, resolve as () => void)
  );

  console.log(
    `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
  );
})();
