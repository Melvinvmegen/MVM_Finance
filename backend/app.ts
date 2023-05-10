import express, { Response, NextFunction } from "express";
import { Request as JWTRequest } from "express-jwt";
import morgan from "morgan";
import cors from "cors";
import chalk from "chalk";
import bodyParser from "body-parser";
import compression from "compression";
import { settings } from "./util/settings.js";
import { expressjwt } from "express-jwt";
import auth from "./api/public/auth.js";
import checkout from "./api/payment/checkout.js";
import customers from "./api/user/customers.js";
import invoices from "./api/user/invoices.js";
import quotations from "./api/user/quotations.js";
import revenus from "./api/user/revenus.js";
import cryptos from "./api/user/cryptos.js";
import banks from "./api/user/banks.js";
import { prisma } from "./util/prisma.js";
import * as dotenv from "dotenv";
dotenv.config();

// Init web server
const app = express();

// compress all responses
app.use(compression());

// Logger
app.use("/api/", morgan(settings.constants.web.logFormat));

// Express API Parse JSON
app.use(bodyParser.json());

// Express API Parse FormData
app.use(bodyParser.urlencoded({ extended: false }));

// Handle options requests
app.use(cors());

// Auth routes
app.use(
  "/api/public",
  expressjwt({
    secret: settings.jwt.secret,
    algorithms: ["HS512"],
    credentialsRequired: false,
  }),
  auth
);

// Stripe routes
app.use(
  "/api/payment",
  expressjwt({
    secret: settings.jwt.secret,
    algorithms: ["HS512"],
    credentialsRequired: false,
  }),
  checkout
)

const validateBelongsToUser = () => {
  return (req: JWTRequest, res: Response, next: NextFunction) => {
    if (req.auth?.userId != req.params.user_id) {
      return res.sendStatus(403);
    }
    next();
  };
};

const validateCustomerBelongsToUser = () => {
  return async (req: JWTRequest, res: Response, next: NextFunction) => {
    try {
      await prisma.customers.findFirst({
        where: {
          id: +req.params.customer_id,
          UserId: +req?.auth?.userId,
        },
      });
    } catch (error) {
      return res.sendStatus(403);
    }

    next();
  };
};

const validateBelongsToBank = () => {
  return async (req: JWTRequest, res: Response, next: NextFunction) => {
    const user = await prisma.users.findUnique({
      where: {
        id: +req?.auth?.userId,
      },
      include: {
        Banks: true,
      },
    });

    const banks = user?.Banks?.filter(
      (bank) => bank.id === Number(req.params.bank_id)
    );

    if (!banks?.length) return res.sendStatus(403);

    // @ts-ignore
    req.originalParams = Object.assign({}, req.params);
    next();
  };
};

// Protect all routes
app.use("/api/user",expressjwt({ secret: settings.jwt.secret, algorithms: ["HS512"] }));
app.use("/api/user/:user_id/customers", validateBelongsToUser(), customers);
app.use("/api/user/:user_id/customers/:customer_id/invoices", validateCustomerBelongsToUser(), invoices);
app.use("/api/user/:user_id/customers/:customer_id/quotations", validateCustomerBelongsToUser(), quotations);
app.use("/api/user/:user_id/banks", validateBelongsToUser(), banks);
app.use("/api/user/:user_id/banks/:bank_id/revenus", validateBelongsToBank(), revenus);
app.use("/api/user/:user_id/cryptos", validateBelongsToUser(), cryptos);

// Error handler
app.use((err: Error, req: JWTRequest, res: Response, next: NextFunction) => {
  switch (err.name) {
    case "AppError":
      console.debug(
        chalk.yellow("NotFoundError"),
        chalk.yellow(err.message),
        "at .../" +
          err.stack
            ?.split("\n")[1]
            .split(/[\\/]/)
            .slice(-3)
            .join("/")
            .slice(0, -1)
      );
      res.status(err.statusCode || 400);
      res.json({
        error: {
          name: err.name,
          message: err.message,
          field: err.params?.field,
          params: err.params,
        },
      });
      break;
    case "UnauthorizedError":
      console.debug(
        chalk.yellow("UnauthorizedError"),
        chalk.yellow(err.message)
      );
      res.status(err.statusCode || 401);
      res.json({
        error: err,
      });
      break;
    default:
      console.error(
        chalk.bold.red("Technical error " + err.name),
        chalk.red(err.message),
        err
      );
      res.status(err.statusCode || 500);
      res.json({
        error: err,
      });
  }
  return next();
});

// Start server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`⚡️ [server]: Server is running at http://localhost:${port}`);
});

// CleanUp after crash
function shutdownGracefully() {
  console.info("Closing server gracefully...");
  server.close(() => {
    console.info("server closed.");
    process.exit(0);
  });
}

process.on("SIGINT", shutdownGracefully);
process.on("SIGTERM", shutdownGracefully);
process.on("SIGHUP", shutdownGracefully);
