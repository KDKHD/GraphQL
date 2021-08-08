import { makeSchemaFromModules } from "@utils/gqlModules";
import example from "./example";
import auth from "./auth"

export const schema = makeSchemaFromModules({
  modules: [example, auth],
});

