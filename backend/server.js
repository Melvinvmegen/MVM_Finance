import { validateBanksBelongsToUser, validateCustomerBelongsToUser } from "./utils/rights.js";
import { green, yellow, red, magenta, gray } from "colorette";
import UnauthorizedError from "./utils/unauthorizedError.js";
import clientWrapper from "./apiClient/wrapper.js";
import { settings } from "./utils/settings.js";
import multipart from "@fastify/multipart";
import { prisma } from "./utils/prisma.js";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import pretty from "pino-pretty";
import { nanoid } from "nanoid";
import fastify from "fastify";
import glob from "glob";
import path from "path";

// Init web server
const basePaths = [path.dirname(import.meta.url), process.cwd()];
const app = clientWrapper(
  fastify({
    disableRequestLogging: true,
    trustProxy: true,
    // @ts-ignore
    genReqId: (req) => (req.headers["Sid"] ? req.headers["Sid"] + "-" + nanoid(4) : nanoid(10)),
    logger: {
      // @ts-ignore
      base: false,
      // @ts-ignore
      stream: settings.logger.json ? undefined : pretty(settings.logger),
      level: settings.logger.minimumLevel,
      customLevels: {
        log: 35,
      },
      formatters: {
        level: (label) => {
          return { level: label === "log" ? "INFO" : label.toUpperCase() };
        },
      },
      timestamp: () => `,"timestamp":"${new Date(Date.now()).toISOString()}"`,
      hooks: {
        logMethod(_inputArgs, method) {
          const inputArgs = _inputArgs.map((arg) => {
            if (arg?.stack) {
              return arg.stack.replaceAll(basePaths[0], ".").replaceAll(basePaths[1], ".");
            }
            return arg;
          });
          if (settings.logger.json) return method.apply(this, inputArgs);
          // @ts-ignore
          if (inputArgs[0]?.http) {
            // @ts-ignore
            if (inputArgs[0].http.status) {
              // @ts-ignore
              inputArgs[0] = `<- ${inputArgs[0]?.http.method} ${inputArgs[0]?.http.path} ${inputArgs[0]?.http.status}`;
            } else {
              // @ts-ignore
              inputArgs[0] = `-> ${inputArgs[0]?.http.method} ${inputArgs[0]?.http.path}`;
            }
          }
          if (settings.logger.colorize) {
            return method.apply(this, [
              inputArgs
                .map((a) => ({ number: magenta("%d"), string: "%s", undefined: gray("%s") }[typeof a] || gray("%o")))
                .join(" "),
              ...inputArgs,
            ]);
          }
          return method.apply(this, [
            inputArgs.map((a) => ({ number: "%d", string: "%s", undefined: "%s" }[typeof a] || "%o")).join(" "),
            ...inputArgs,
          ]);
        },
      },
    },
  })
);

// Handle options requests
app.register(cookie);
app.register(multipart);
app.register(jwt, {
  secret: settings.jwt.secret,
  cookie: {
    cookieName: "MVMTOKEN",
    signed: false,
  },
});
app.register(cors, {
  origin: /\.melvinvmegen\.com$/,
  allowedHeaders: "Content-Type, Authorization, Cookie, Content-Length, Sid, Reqid, X-Requested-With, X-Device",
  credentials: true,
  methods: "GET,PUT,POST,DELETE,OPTIONS,PATCH",
});

// TODO: check request
// app.use("/api/payment/webhooks", bodyParser.raw({ type: "*/*" }), paymentWehbooks);

// TODO: handle formData
// app.use(bodyParser.urlencoded({ extended: false }));

app.addHook("onRequest", async (request) => {
  const level = request.url !== "/n/health" && request.method !== "OPTIONS" ? "info" : "debug";
  const requestMethod = settings.logger.colorize
    ? (request.method === "GET" ? gray : magenta)(request.method)
    : request.method;
  const path = settings.logger.colorize && request.headers["request-id"] ? gray(request.url) : request.url;
  request.log[level]({
    http: {
      method: requestMethod,
      path,
      host: request.hostname,
      client: request.ip,
      referrer: request.headers["referer"],
      agent: request.headers["user-agent"],
      // @ts-ignore
      user: request.user?.login,
    },
  });
});

app.addHook("preHandler", async (req) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    req.log.debug(err);
  }
  if (req.url.includes("/api/payment")) {
    const authHeader = req.headers.authorization;
    if (!authHeader && !req.user) {
      throw new UnauthorizedError("errors.server.missingCredentials");
    }
    if (authHeader) {
      const encodedCreds = authHeader.split(" ")[1];
      const decodedCreds = Buffer.from(encodedCreds, "base64").toString();
      const [username, password] = decodedCreds.split(":");
      if (username !== settings.basicAuth.username || password !== settings.basicAuth.password) {
        throw new UnauthorizedError("errors.server.unauthorized");
      }
    }
  }

  if (/\/api\/banks\/[0-9]+\/(?:revenus)/.test(req.url)) {
    if (!validateBanksBelongsToUser) throw new UnauthorizedError("errors.server.unauthorized");
  }

  if (/\/api\/customers\/[a-zA-Z0-9]+\/(?:invoices|quotations)/.test(req.url)) {
    if (!validateCustomerBelongsToUser(req)) throw new UnauthorizedError("errors.server.unauthorized");
  }
});

app.addHook("onResponse", async (request, reply) => {
  const level = request.url !== "/n/health" && request.method !== "OPTIONS" ? "info" : "debug";
  const statusCode = settings.logger.colorize
    ? (reply.statusCode < 400 ? green : reply.statusCode < 500 ? yellow : red)(reply.statusCode)
    : reply.statusCode;
  const requestMethod = settings.logger.colorize
    ? (["GET", "OPTIONS"].includes(request.method) ? gray : magenta)(request.method)
    : request.method;
  const path = settings.logger.colorize && request.headers["request-id"] ? gray(request.url) : request.url;
  request.log[level]({
    http: {
      method: requestMethod,
      path,
      // @ts-ignore
      status: statusCode,
      responsetime: Math.round(10 * reply.getResponseTime()) / 10,
      size: +reply.getHeader("content-length"),
    },
  });
});

// Error handler
app.setErrorHandler(function (error, request, reply) {
  switch (error.name) {
    case "AppError":
      reply.log.warn(error.name + ": " + error.message);
      reply.status(error["status"] || 400).send({
        error: {
          name: error.name,
          message: error.message,
          field: error["params"] && error["params"]["field"],
          params: error["params"],
        },
      });
      break;
    case "UnauthorizedError":
      reply.log.warn(error.name + ": " + error.message);
      reply.status(error["status"] || 401).send({
        name: error.name,
        message: error.message,
      });
      break;
    default:
      reply.log.error(error);
      reply.status(500).send({ error: { name: error.name, message: error.message } });
  }
});

app.get("/health", async () => {
  return {
    status: (await prisma.$queryRaw`SELECT 1`) && "UP",
  };
});

// Include all routes
for (const file of glob.sync("./api/**/[^._]*.js")) {
  app.register(import(file), { prefix: path.dirname(file.slice(2)) });
}

// Start server
try {
  await app.listen({
    listenTextResolver: (address) => `API Server listening on port ${address.split(":").pop()}`,
    port: +settings.web.port,
    host: settings.web.host,
  });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
