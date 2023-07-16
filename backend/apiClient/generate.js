import glob from "glob";
import path from "path";
import fs from "fs";

export async function generateClient(options) {
  const { globPattern, outputFilePath, jsNamespace, headerTemplate, indentString, endpointTemplate } = Object.assign(
    {
      headerTemplate: `/* eslint-disable no-unused-vars */
import { useOFetch, useOFetchRaw } from "@/plugins/ofetch";
`,
      indentString: "  ",
      endpointTemplate: ({ method, relativePath, endpointUrl, functionName, params }) => {
        let funcParams;
        let xhrCall;
        switch (method) {
          case "get":
          case "delete":
            funcParams = `${params.join(", ")}${params.length ? ", " : ""}query = undefined`;
            xhrCall = `return await useOFetch(\`${endpointUrl}\`, { method: "${method.toUpperCase()}", query });`;
            break;
          case "download":
            funcParams = `${params.join(", ")}${params.length ? ", " : ""}query = undefined`;
            xhrCall = `const response = await useOFetchRaw(\`${endpointUrl}\`, { responseType: "blob", query });
  const href = URL.createObjectURL(response._data);
  const a = document.createElement("a");
  a.href = href;
  a.download = ((response.headers.get("content-disposition") || "").match(/filename="?(.+)"?/) || [])[1] || "${endpointUrl
    .split("/")
    .pop()}";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
  return null;`;
            break;
          case "upload":
            funcParams = `${params.join(", ")}${params.length ? ", " : ""}body = undefined, query = undefined`;
            xhrCall = `const formData = new FormData();
  for (const key in body) formData.append(key, body[key]);
  return await useOFetch(\`${endpointUrl}\`, { method: "POST", query, body: formData });`;
            break;
          default:
            funcParams = `${params.join(", ")}${params.length ? ", " : ""}body = undefined, query = undefined`;
            xhrCall = `return await useOFetch(\`${endpointUrl}\`, { method: "${method.toUpperCase()}", body, query });`;
        }
        return `/** @type {OmitThisParameter<import("${relativePath}").${functionName}>}  */
export async function ${functionName}(${funcParams}) {
  ${xhrCall}
}
`;
      },
    },
    options
  );

  const contexts = {};

  for (const filepath of glob.sync(globPattern)) {
    const module = await import(`file://${path.resolve(filepath)}`);
    await module.default({
      $get: async (url, handler) =>
        await appendEndpoint({ method: "get", filepath, url, handler }, contexts, {
          outputFilePath,
          headerTemplate,
          endpointTemplate,
          indentString,
          jsNamespace,
        }),
      $post: async (url, handler) =>
        await appendEndpoint({ method: "post", filepath, url, handler }, contexts, {
          outputFilePath,
          headerTemplate,
          endpointTemplate,
          indentString,
          jsNamespace,
        }),
      $put: async (url, handler) =>
        await appendEndpoint({ method: "put", filepath, url, handler }, contexts, {
          outputFilePath,
          headerTemplate,
          endpointTemplate,
          indentString,
          jsNamespace,
        }),
      $patch: async (url, handler) =>
        await appendEndpoint({ method: "patch", filepath, url, handler }, contexts, {
          outputFilePath,
          headerTemplate,
          endpointTemplate,
          indentString,
          jsNamespace,
        }),
      $delete: async (url, handler) =>
        await appendEndpoint({ method: "delete", filepath, url, handler }, contexts, {
          outputFilePath,
          headerTemplate,
          endpointTemplate,
          indentString,
          jsNamespace,
        }),
      $download: async (url, handler) => {
        await appendEndpoint({ method: "download", filepath, url, handler }, contexts, {
          outputFilePath,
          headerTemplate,
          endpointTemplate,
          indentString,
          jsNamespace,
        });
      },
      $upload: async (url, handler) =>
        await appendEndpoint({ method: "upload", filepath, url, handler }, contexts, {
          outputFilePath,
          headerTemplate,
          endpointTemplate,
          indentString,
          jsNamespace,
        }),
    });
  }

  for (const [outputFilename, context] of Object.entries(contexts)) {
    while (context.currentNamespace.length > 0) {
      context.indent = context.currentNamespace.length - 1;
      context.outputString +=
        indentString.repeat(context.indent) + "}" + (context.currentNamespace.length === 1 ? ";" : ",") + "\n";
      if (context.currentNamespace.length === 1) {
        context.outputString +=
          indentString.repeat(context.indent) +
          `export { _${context.currentNamespace[0]} as ${context.currentNamespace[0]} };\n`;
      }
      context.currentNamespace.pop();
    }
    const currentContent = fs.existsSync(outputFilename) && (await fs.promises.readFile(outputFilename, "utf8"));
    if (currentContent !== context.outputString) {
      console.log(`Generating API Client ${outputFilename}`);
      await fs.promises.writeFile(outputFilename, context.outputString, "utf8");
    }
  }
}

async function appendEndpoint(
  { filepath, method, url, handler },
  contexts,
  { outputFilePath, headerTemplate, indentString, endpointTemplate, jsNamespace }
) {
  const outputFilename = outputFilePath(filepath, method, url, handler);
  const context = (contexts[outputFilename] = contexts[outputFilename] || {
    outputString:
      typeof headerTemplate === "function" ? headerTemplate(filepath, method, url, handler) : headerTemplate || "",
    currentNamespace: [],
    indent: 0,
  });

  const endpointString = endpointTemplate({
    method,
    relativePath: path.relative(path.dirname(outputFilename), filepath).replace(/\\/g, "/"),
    params: url
      .split("/")
      .filter((u) => u.startsWith(":"))
      .map((u) => u.slice(1)),
    functionName: handler.name,
    // TODO: support more query params?
    endpointUrl: url.replace(/\/:([^/]+)(\/|$)/g, "/${$1}$2"),
  });

  let namespace =
    typeof jsNamespace === "function" ? jsNamespace(filepath, method, url, handler) : jsNamespace.split(".");
  if (namespace && namespace.length) {
    while (!context.currentNamespace.every((val, i) => namespace[i] === val)) {
      context.indent = context.currentNamespace.length - 1;
      context.outputString +=
        indentString.repeat(context.indent) + "}" + (context.currentNamespace.length === 1 ? ";" : ",") + "\n";
      if (context.currentNamespace.length === 1) {
        context.outputString +=
          indentString.repeat(context.indent) +
          `export { _${context.currentNamespace[0]} as ${context.currentNamespace[0]} };\n`;
      }
      context.currentNamespace.pop();
    }
    while (context.currentNamespace.length < namespace.length) {
      const name = namespace.at(context.currentNamespace.length);
      context.outputString +=
        indentString.repeat(context.indent) +
        (context.currentNamespace.length ? "" : "const _") +
        name +
        (context.currentNamespace.length ? ": " : " = ") +
        "{\n";
      context.currentNamespace.push(name);
      context.indent = context.currentNamespace.length;
    }
  }
  context.outputString += endpointString
    .split("\n")
    .map((l) => (l.trim() ? indentString.repeat(context.indent) + l.trimEnd() : ""))
    .join("\n");
}
