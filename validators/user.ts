import { UserInputError } from "apollo-server-express";
import Joi from "joi";

export const passwordValidator = Joi.string()
  .min(7)
  .pattern(new RegExp(".*[0-9].*"), "case1")
  .pattern(new RegExp(".*[A-Z].*"), "case2")
  .pattern(new RegExp(".*[a-z].*"), "case3")
  .pattern(new RegExp(`.*[$&+,:;=?@#|\/"{}='<>£.^*()%!-].*`), "case4")
  .error((err) => {
    const errors = err.map((e) => {
      switch (e.code) {
        case "string.min": {
          return "Be at least 7 characters long.";
        }
        case "string.pattern.name": {
          switch ((e as any)?.local?.name) {
            case "case1": {
              return "Contain at least one number.";
            }
            case "case2": {
              return "Contain at least one upper case character.";
            }
            case "case3": {
              return "Contain at least one lower case character.";
            }
            case "case4": {
              return `Contain at least one of these: $ & + , : ; = ? @ # | / " { } = ' < > £ . ^ * ( ) % ! - special characters.`;
            }
            default: {
              return e.message;
            }
          }
        }
        default: {
          return e.message;
        }
      }
    });

    throw new UserInputError(`Password does not meet all criterion.`, {
      missingCriterion: errors,
    });
  });
