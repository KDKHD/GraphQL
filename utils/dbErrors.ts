import { UserInputError } from "apollo-server-express";

export const dbErrorHandler = (e:any) => {
    switch (e.code) {
        case "P2002": {
          throw new UserInputError(
            "These details already exist.",
            { target: e.meta.target }
          );
        }
        default: {
          throw e;
        }
      }
}