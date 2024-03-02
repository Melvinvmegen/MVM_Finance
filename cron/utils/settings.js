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
    smtp_user: process.env.SMTP_USER,
    smtp_pass: process.env.SMTP_PASS,
    alert: process.env.MAIL_ALERT || "melvin.vmegen@gmail.com",
    alert_from_name: process.env.MAIL_ALERT_FROM_NAME || "MVM Alert",
    alert_from_address:
      process.env.MAIL_ALERT_FROM_ADDRESS || "alert@melvinvmegen.com",
  },
  finance: {
    baseRequestsUrl: process.env["FINANCE_BASE_REQUESTS_URL"],
    apiUsername: process.env["FINANCE_API_USERNAME"],
    apiPassword: process.env["FINANCE_API_PASSWORD"],
  },
  cron: {
    cronDelayMs: process.env["CRON_CRON_DELAY_MS"] || 60000,
    cronOffsetMS: process.env["CRON_CRON_OFFSET_MS"] || 0,
    statsDelayMs: process.env["CRON_STATS_DELAY_MS"] || 60000,
    statsOffsetMs: process.env["CRON_STATS_OFFSET_MS"] || 0,
    statsFromMs: process.env["CRON_STATS_FROM_MS"] || 300000,
  },
};
