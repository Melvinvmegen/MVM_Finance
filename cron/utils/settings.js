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
    from: process.env.MAIL_FROM || "invoices@melvinvmegen.com",
    from_name: process.env.MAIL_FROM_NAME || "Melvin Van Megen",
    bcc: process.env.MAIL_BCC || "melvin.vmegen@gmail.com",
    replace: process.env.MAIL_REPLACE_EMAIL || "melvin.vmegen@gmail.com", //do not fill this in dev env, use .env instead
    smtp_url: process.env.SMTP_URL || null, // alternative connection method
    smtp_service: process.env.SMTP_SERVICE || "SendinBlue",
  },
};
