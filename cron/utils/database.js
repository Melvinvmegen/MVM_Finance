import { settings } from "./settings.js";
import knex from "knex";

export const database = knex({
  client: settings.database.db_client,
  connection: {
    host: settings.database.db_host,
    port: settings.database.db_port,
    user: settings.database.db_user,
    password: settings.database.db_password,
    database: settings.database.db_database,
  },
});
