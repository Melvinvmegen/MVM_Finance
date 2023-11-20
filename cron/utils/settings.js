export const settings = {
  database: {
    db_client: process.env.DB_CLIENT || "postgres",
    db_host: process.env.DB_HOST || "127.0.0.1",
    db_port: process.env.DB_PORT || "5432",
    db_user: process.env.DB_USER || "postgres",
    db_password: process.env.DB_PASSWORD || "password",
    db_database: process.env.DB_DATABASE || "mvm_finance",
  },
};
