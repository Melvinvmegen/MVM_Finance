if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const glob = require("glob")
const chalk = require("chalk")
const bodyParser = require("body-parser")
const compression = require("compression")
const settings = require("./util/settings")
const jwt = require("express-jwt")
const path = require("path");

// patch express async error handling
require("express-async-errors");

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
app.use("/api/public", jwt(Object.assign({ credentialsRequired: false }, settings.jwt)));

// Protect all routes
app.all("/api/user/*", jwt(settings.jwt));

// Apply all routes from API folder
glob.sync("./api/**/[^._]*.js").map((file) => {
  app.use(path.dirname(file.slice(1)), require(file));
});

// Error handler
app.use((err, req, res, next) => {
  switch (err.name) {
    case "AppError":
      console.debug(
        chalk.yellow("NotFoundError"),
        chalk.yellow(err.message),
        "at .../" +
          err.stack
            .split("\n")[1]
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
          field: err.params && err.params.field,
          params: err.params,
        },
      });
      break;
    case "UnauthorizedError":
      console.debug(
        chalk.yellow("UnauthorizedError"),
        chalk.yellow(err.message)
      );
      res.status(err.status || 401);
      res.json({
        error: err,
      });
      break;
    case "SequelizeValidationError":
      if (err.errors) {
        err.errors.forEach((e) =>
          console.debug(
            chalk.yellow("ValidationError"),
            chalk.yellow(e.message)
          )
        );
      }
      res.status(err.status || 400);
      res.json({
        error: err.errors
          ? err.errors.map((e) => ({
              name: err.name,
              message: e.message,
              code: e.validatorKey,
              field: e.path,
              params: e.validatorArgs,
            }))
          : err,
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
app.listen(port, () => {
  console.log(chalk.green(`Server started at http://localhost:${port}`));
});


// CleanUp after crash
process.on("SIGINT", () => {
  console.log("Stopping...");
  process.exit();
});
