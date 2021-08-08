import passport from "@root/passport/passport";
import express from "express"

export const authMiddleware = (req:express.Request, res: express.Response, next: express.NextFunction) => {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (user) (req as any).user = user;
        next();
      })(req, res, next);
}