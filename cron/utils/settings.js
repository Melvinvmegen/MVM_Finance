export const settings = {
  database: {
    db_client: process.env.DB_CLIENT || "postgres",
    db_host: process.env.DB_HOST || "127.0.0.1",
    db_port: process.env.DB_PORT || "5432",
    db_user: process.env.DB_USER || "postgres",
    db_password: process.env.DB_PASSWORD || "password",
    db_database: process.env.DB_DATABASE || "mvm_finance",
  },
  email: {
    from: process.env["MAIL_FROM"] || "melvin.vmegen@gmail.com",
    replace: process.env["MAIL_REPLACE_EMAIL"] || null, //do not fill this in dev env, use .env instead
    smtp_url: process.env["SMTP_URL"] || null, // alternative connection method
    smtp_service: process.env["SMTP_SERVICE"] || "SendinBlue",
    smtp_user: process.env["SMTP_USER"] || "melvin.vmegen@gmail.com",
    smtp_pass: process.env["SMTP_PASS"] || "AXSGTpaLxcB40hKt", // TODO: change pass
  },
};
