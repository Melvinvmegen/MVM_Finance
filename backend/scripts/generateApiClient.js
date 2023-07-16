import { generateClient } from "../apiClient/generate.js";
import path from "path";

await generateClient({
  globPattern: "./api/!(payment)/*.js",
  outputFilePath: (filepath) => `../frontend/src/utils/generated/api-${path.dirname(filepath).split(/[\\/]/g)[2]}.ts`,
});
