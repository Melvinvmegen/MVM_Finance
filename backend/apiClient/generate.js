/* eslint-disable no-console */
import path from "path";
import fs from "fs";
import glob from "glob";

export async function generateClient(options) {
  const { globPattern, outputFilePath, urlPrefix, headerTemplate, endpointTemplate, jsNamespace, indentString } =
    Object.assign(
      {
        headerTemplate: `/* eslint-disable no-unused-vars */
import { useOFetch, useOFetchRaw } from "@/plugins/ofetch";

`,
        indentString: "  ",
        endpointTemplate: ({ method, relativePath, functionName, params, endpointUrl, namespace }) => {
          let importType = params.map((param) => `@param {string|string[]|number} ${param}`);
          const funcExport = `${
            namespace && namespace.length ? `${functionName}: ` : "export "
          }async function ${functionName}`;
          let funcParams;
          let xhrCall;
          switch (method) {
            case "get":
            case "delete":
              importType.push(`@param {Record<string,string|string[]|number>} [query]`);
              importType.push(`@returns {Promise<ReturnType<import("${relativePath}").${functionName}>>}`);
              funcParams = `${params.join(", ")}${params.length ? ", " : ""}query = undefined`;
              xhrCall = `return await useOFetch(\`${endpointUrl}\`, { method: "${method.toUpperCase()}", query });`;
              break;
            case "download":
              importType.push(`@param {Record<string,string|string[]|number>} [query]`);
              importType.push(`@returns {void}`);
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
              importType.push(`@param {Record<string, any>} body`);
              importType.push(`@param {Record<string,string|string[]|number>} [query]`);
              importType.push(`@returns {Promise<ReturnType<import("${relativePath}").${functionName}>>}`);
              funcParams = `${params.join(", ")}${params.length ? ", " : ""}body = undefined, query = undefined`;
              xhrCall = `const formData = new FormData();
  for (const key in body) {
    if (body[key] instanceof Array && body[key][0] instanceof Blob) {
      // append last
    } else if (body[key] instanceof Blob) {
      // append last
    } else if (typeof body[key] === "string") {
      formData.append(key, body[key]);
    } else {
      formData.append(key, new Blob([JSON.stringify(body[key])], { type: "application/json" }));
    }
  }
  for (const key in body) {
    if (body[key] instanceof Array && body[key][0] instanceof Blob) {
      for (const blob of body[key]) formData.append(key, blob);
    } else if (body[key] instanceof Blob) {
      formData.append(key, body[key]);
    }
  }
  return await useOFetch(\`${endpointUrl}\`, { method: "POST", query, body: formData });`;
              break;
            default:
              importType.push(`@param {Parameters<import("${relativePath}").${functionName}>[${params.length}]} body`);
              importType.push(`@param {Record<string,string|string[]|number>} [query]`);
              importType.push(`@returns {Promise<ReturnType<import("${relativePath}").${functionName}>>}`);
              funcParams = `${params.join(", ")}${params.length ? ", " : ""}body = undefined, query = undefined`;
              xhrCall = `return await useOFetch(\`${endpointUrl}\`, { method: "${method.toUpperCase()}", body, query });`;
          }
          return `/**
 * ${importType.join(`
 * `)}
**/
${funcExport}(${funcParams}) {
  ${xhrCall}
}${namespace && namespace.length ? "," : ""}
`;
        },
      },
      options
    );
  const contexts = {};

  for (const filepath of glob.sync(globPattern)) {
    // TODO : use relative path ../../
    const module = await import("file://" + path.resolve(filepath));
    await module.default({
      $get: async (url, handler) =>
        await appendEndpoint({ method: "get", filepath, url, handler }, contexts, {
          outputFilePath,
          urlPrefix,
          headerTemplate,
          endpointTemplate,
          jsNamespace,
          indentString,
        }),
      $post: async (url, handler) =>
        await appendEndpoint({ method: "post", filepath, url, handler }, contexts, {
          outputFilePath,
          urlPrefix,
          headerTemplate,
          endpointTemplate,
          jsNamespace,
          indentString,
        }),
      $put: async (url, handler) =>
        await appendEndpoint({ method: "put", filepath, url, handler }, contexts, {
          outputFilePath,
          urlPrefix,
          headerTemplate,
          endpointTemplate,
          jsNamespace,
          indentString,
        }),
      $patch: async (url, handler) =>
        await appendEndpoint({ method: "patch", filepath, url, handler }, contexts, {
          outputFilePath,
          urlPrefix,
          headerTemplate,
          endpointTemplate,
          jsNamespace,
          indentString,
        }),
      $delete: async (url, handler) =>
        await appendEndpoint({ method: "delete", filepath, url, handler }, contexts, {
          outputFilePath,
          urlPrefix,
          headerTemplate,
          endpointTemplate,
          jsNamespace,
          indentString,
        }),
      $download: async (url, handler) =>
        await appendEndpoint({ method: "download", filepath, url, handler }, contexts, {
          outputFilePath,
          urlPrefix,
          headerTemplate,
          endpointTemplate,
          jsNamespace,
          indentString,
        }),
      $upload: async (url, handler) =>
        await appendEndpoint({ method: "upload", filepath, url, handler }, contexts, {
          outputFilePath,
          urlPrefix,
          headerTemplate,
          endpointTemplate,
          jsNamespace,
          indentString,
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
      await fs.promises.writeFile(outputFilename, context.outputString, "utf8");
    }
  }
}

async function appendEndpoint(
  { filepath, method, url, handler },
  contexts,
  { outputFilePath, urlPrefix, headerTemplate, endpointTemplate, jsNamespace, indentString }
) {
  const outputFilename =
    typeof outputFilePath === "function"
      ? outputFilePath(filepath, method, url, handler)
      : outputFilePath || "./apiclient.js";
  const context = (contexts[outputFilename] = contexts[outputFilename] || {
    outputString:
      typeof headerTemplate === "function" ? headerTemplate(filepath, method, url, handler) : headerTemplate || "",
    currentNamespace: [],
    indent: 0,
  });
  const prefix = typeof urlPrefix === "function" ? urlPrefix(filepath, method, url, handler) : urlPrefix || "";
  let namespace = typeof jsNamespace === "function" ? jsNamespace(filepath, method, url, handler) : jsNamespace;
  if (typeof namespace === "string") namespace = namespace.split(".");
  const fullUrl = (prefix + url).replace(/\/\//g, "/");
  const endpointString = endpointTemplate({
    method,
    relativePath: path.relative(path.dirname(outputFilename), filepath).replace(/\\/g, "/"),
    params: fullUrl
      .split("/")
      .filter((u) => u.startsWith(":"))
      .map((u) => u.slice(1)),
    functionName:
      handler.name ||
      `${method}${url
        .split(/\/|-/g)
        .filter((u) => u && !u.startsWith(":"))
        .map((u) => u.charAt(0).toUpperCase() + u.slice(1))
        .join("")}`,
    endpointUrl: fullUrl.replace(/\/:([^/]+)/g, "/${$1}"),
    namespace,
  });
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
