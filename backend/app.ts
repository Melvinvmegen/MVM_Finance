import express, { Request, Response, NextFunction } from 'express';
import morgan from "morgan";
import cors from "cors";
import chalk from "chalk";
import bodyParser from "body-parser";
import compression from "compression";
import { settings } from "./util/settings.js";
import { expressjwt } from "express-jwt";
import auth from "./api/public/auth.js"
import customers from "./api/user/customers.js"
import invoices from "./api/user/invoices.js"
import quotations from "./api/user/quotations.js"
import revenus from "./api/user/revenus.js"
import cryptos from "./api/user/cryptos.js"
import * as dotenv from "dotenv"
dotenv.config()

// Init web server
const app = express();

// compress all responses
app.use(compression());

// Logger
app.use("/api/", morgan(settings.constants.web.logFormat));

// Express API Parse JSON
app.use(bodyParser.json());

// Handle options requests
app.use(cors());

// Auth routes
app.use("/api/public", expressjwt({secret: settings.jwt.secret, algorithms: ["HS512"], credentialsRequired: false}), auth);

// Protect all routes
app.use("/api/user", expressjwt({secret: settings.jwt.secret, algorithms: ["HS512"]}));
app.use("/api/user", customers);
app.use("/api/user", invoices);
app.use("/api/user", quotations);
app.use("/api/user", revenus);
app.use("/api/user", cryptos);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
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
