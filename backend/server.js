import { validateCustomerBelongsToUser } from "./utils/rights.js";
import { green, yellow, red, magenta, gray } from "colorette";
import UnauthorizedError from "./utils/unauthorizedError.js";
import { createRedisClient } from "./utils/cacheManager.js";
import { rateLimiter } from "./utils/rateLimiter.js";
import clientWrapper from "./apiClient/wrapper.js";
import { settings } from "./utils/settings.js";
import multipart from "@fastify/multipart";
import { prisma } from "./utils/prisma.js";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import pretty from "pino-pretty";
import { nanoid } from "nanoid";
import fastify from "fastify";
import dayjs from "dayjs";
import glob from "glob";
import path from "path";

await import("dayjs/locale/fr.js");
dayjs.locale("fr");

// Init web server
const basePaths = [path.dirname(import.meta.url), process.cwd()];
const app = clientWrapper(
  // @ts-ignore
  fastify({
    bodyLimit: 348576,
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
      timestamp: () => `,"timestamp":"${dayjs().toISOString()}"`,
      hooks: {
        logMethod(_inputArgs, method) {
          const inputArgs = _inputArgs.map((arg) => {
            if (arg?.stack) {
              return arg.stack.replaceAll(basePaths[0], ".").replaceAll(basePaths[1], ".");
            }
            return arg;
          });
          if (settings.logger.json) return method.apply(this, inputArgs);

          if (inputArgs[0]?.http) {
            if (inputArgs[0].http.status) {
              inputArgs[0] = `<- ${inputArgs[0]?.http.method} ${inputArgs[0]?.http.path} ${inputArgs[0]?.http.status}`;
            } else {
              inputArgs[0] = `-> ${inputArgs[0]?.http.method} ${inputArgs[0]?.http.path} ${
                inputArgs[0]?.http.user ? inputArgs[0]?.http.user : inputArgs[0]?.http.client
              }`;
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
app.register(helmet, {
  global: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: {
    policy: "unsafe-none",
  },
  crossOriginOpenerPolicy: {
    policy: "same-origin",
  },
  crossOriginResourcePolicy: {
    policy: "same-site",
  },
  originAgentCluster: true,
  referrerPolicy: {
    policy: "no-referrer",
  },
  strictTransportSecurity: {
    maxAge: 15552000,
    includeSubDomains: true,
  },
  xContentTypeOptions: false,
  xDnsPrefetchControl: { allow: true },
});

await app.register(import("fastify-raw-body"), {
  field: "rawBody",
  global: false,
  encoding: "utf8",
  runFirst: true,
  routes: ["/api/payment/webhooks"],
  jsonContentTypes: [],
});

app.addHook("preHandler", async (request) => {
  if (
    !request.url?.includes("/public") &&
    !request.url?.includes("/health") &&
    !request.url?.includes("/payment") &&
    !request.raw?.url?.includes("/payment") &&
    !request.url?.includes("/cron") &&
    !request.user
  ) {
    throw new UnauthorizedError("errors.server.unauthorized");
  }

  if (
    !request.user &&
    (request?.url.includes("/cron") || (request?.url.includes("/payment") && !request?.url.includes("/webhooks")))
  ) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError("errors.server.missingCredentials");
    } else {
      const encodedCreds = authHeader.split(" ")[1];
      const decodedCreds = Buffer.from(encodedCreds, "base64").toString();
      const [username, password] = decodedCreds.split(":");
      if (username !== settings.basicAuth.user || password !== settings.basicAuth.password) {
        throw new UnauthorizedError("errors.server.unauthorized");
      }
    }
  }

  if (/\/api\/user\/customers\/[a-zA-Z0-9]+\/(?:invoices|quotations)/.test(request?.url)) {
    if (!validateCustomerBelongsToUser(request)) throw new UnauthorizedError("errors.server.unauthorized");
  }
});

app.addHook("onRequest", async (request) => {
  const level = request.url !== "/health" && request.method !== "OPTIONS" ? "info" : "debug";
  const requestMethod = settings.logger.colorize
    ? (request.method === "GET" ? gray : magenta)(request.method)
    : request.method;
  const path = settings.logger.colorize && request.headers["request-id"] ? gray(request.url) : request.url;

  try {
    await request.jwtVerify({ onlyCookie: true });
  } catch (err) {
    if (
      !request.url?.includes("/public") &&
      !request.url?.includes("/health") &&
      !request.url?.includes("/payment") &&
      !request.url?.includes("/cron")
    ) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  if (
    !request.url?.includes("/public") &&
    !request.url?.includes("/health") &&
    !request.url?.includes("/payment") &&
    !request.url?.includes("/cron") &&
    !request.user
  ) {
    try {
      await rateLimiter(request);
    } catch (err) {
      throw new UnauthorizedError("errors.server.unauthorized");
    }
  }

  request.log[level]({
    http: {
      method: requestMethod,
      path,
      host: request.hostname,
      client: request.ip,
      referrer: request.headers["referer"],
      agent: request.headers["user-agent"],
      // @ts-ignore
      user: request.user?.email,
    },
  });
});

app.addHook("onResponse", async (request, reply) => {
  const level = request?.url !== "/health" && request.method !== "OPTIONS" ? "info" : "debug";
  const statusCode = settings.logger.colorize
    ? (reply.statusCode < 400 ? green : reply.statusCode < 500 ? yellow : red)(reply.statusCode)
    : reply.statusCode;
  const requestMethod = settings.logger.colorize
    ? (["GET", "OPTIONS"].includes(request.method) ? gray : magenta)(request.method)
    : request.method;
  const path = settings.logger.colorize && request.headers["request-id"] ? gray(request?.url) : request?.url;
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

// Create redis
await createRedisClient();

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
