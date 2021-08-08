import passport from "@root/passport/passport";
import express from "express";
const router = express.Router();

router
  .route("/").all((req, res, next)=>{
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (user) (req as any).user = user;
        next();
      })(req, res, next);
  })

export default router