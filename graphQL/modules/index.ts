import { makeSchemaFromModules } from "@utils/gqlModules";
export * from "./parent";
import example from "./example";
import auth from "./auth";
import user from "./user";
import phone_number from "./phone_number";
import email from "./email";

export const schema = makeSchemaFromModules({
  modules: [example, auth, user, phone_number, email],
});
