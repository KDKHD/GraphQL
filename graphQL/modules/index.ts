import { makeSchemaFromModules } from "@utils/gqlModules";
export * from './parent'
import example from "./example";
import auth from "./auth"
import user from "./user"

export const schema = makeSchemaFromModules({
  modules: [example, auth, user],
});

