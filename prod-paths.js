
const tsConfigPaths = require("tsconfig-paths");
 
const paths = {
    "@models/*": ["./build/models/*"],
        "@modules/*": ["./build/graphQL/modules/*"],
        "@graphQL/*": ["./build/graphQL/*"],
        "@controllers/*": ["./build/controllers/*"],
        "@routes/*": ["./build/routes/*"],
        "@utils/*": [".utils/*"],
        "@validators/*": ["v./build/alidators/*"],
        "@services/*": ["./build/controllers/services/*"],
        "@middlewares/*": ["./build/controllers/services/middlewares/*"],
        "@config/*": ["./build/config/*"],
        "@queries/*": ["./build/queries/*"],
        "@schemas/*": ["./build/schemas/*"],
        "@customTypes/*": ["./build/types/*"],
        "@root/*": ["./build/*"],
  }

const baseUrl = "./dist"; // Either absolute or relative path. If relative it's resolved to current working directory.
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: paths
});
 
// When path registration is no longer needed
// cleanup();