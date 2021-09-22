import passport from "passport";
import passportJWT, { ExtractJwt } from "passport-jwt";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { root } from "@utils/root";
import { prismaClient } from "@root/dbconnection/client";
import { UsersProvider } from "@root/graphQL/modules/user/provider";
import { QueryArgsType } from "@utils/queryHelpers";

dotenv.config();

const { Strategy } = passportJWT;

const PUBLIC_KEY = fs.readFileSync(
  path.join(root, process.env.JWT_PUBLIC_KEY as string)
);

const params = {
  secretOrKey: PUBLIC_KEY,
  jwtFromRequest: (req: any) => {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    return token;
  },
};

passport.use(
  new Strategy(params, async (payload: { user_id: string }, done: any) => {
    const userProvider = new UsersProvider();
    const user = await userProvider
        .dataLoaderManager({ type: QueryArgsType.Query })
        .load([["user_id", payload.user_id]])
    return done(null, user);
  })
);

export default passport;
