import { users } from "@root/test/users";

import passport from "passport";
import passportJWT, { ExtractJwt } from "passport-jwt";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { root } from "@utils/root";

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
  new Strategy(params, async (payload: { user_id: String }, done: any) => {
    const user = users.accounts.find((user) => {
      return user.id == payload.user_id;
    });
    return done(null, user);
  })
);

export default passport;
