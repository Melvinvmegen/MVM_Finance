import { generateClient } from "../apiClient/generate.js";
import path from "path";

await generateClient({
  globPattern: "./api/!(payment)/*.js",
  urlPrefix: (filepath /*, method, url, handler*/) => "/" + path.dirname(filepath).slice(2),
  outputFilePath: (filepath) => `../frontend/src/utils/generated/api-${path.dirname(filepath).split(/[\\/]/g)[2]}.ts`,
});
