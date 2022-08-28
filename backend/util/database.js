const settings = require("./settings")

const db = require("knex")({
  client: 'pg',
  connection: settings.database.dbConnectionUri,
  searchPath: ['knex', 'public'],
  migrations: {
    tableName: 'migrations'
  }
});

module.exports = { db };