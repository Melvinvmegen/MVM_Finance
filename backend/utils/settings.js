import { isColorSupported } from "colorette";

export const settings = {
  database: {
    dbConnectionUri:
      process.env.DATABASE_URL ||
      "postgres://postgres:password@127.0.0.1:5432/mvm_finance?connectTimeout=5000&autoReconnect=true&timezone=Europe/Paris",
    logging: process.env.DB_LOGGING || false,
    timezone: process.env.DB_TIMEZONE || "Europe/Paris",
  },
  logger: {
    colorize: !process.env.LOGGER_DISABLE_COLORS && isColorSupported,
    json: !!process.env.LOGGER_JSON,
    translateTime: process.env.LOGGER_TRANSLATE_TIME || "SYS:HH:MM:ss",
    ignore: process.env.LOGGER_IGNORED_FIELDS || "reqId,http",
    customColors: "warn:yellow,info:cyan,debug:gray,error:red,message:reset",
    minimumLevel: process.env.LOGGER_MIN_LEVEL || "info",
    errorProps: "error,err",
  },
  jwt: {
    secret: process.env.JWT_SECRET || Buffer.from("Yn2kjibddFAWtnPJ2AFlL8WXmohJMCvigQggaEypa5E=", "base64"),
    expiresIn: process.env.JWT_EXPIRES_IN || 10 * 24 * 3600,
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || 86400,
  },
  web: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || "0.0.0.0",
  },
  email: {
    sendinblueApiKey:
      process.env.SENDINBLUE_API_KEY ||
      "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",
    replace: process.env.MAIL_REPLACE_EMAIL || null, //do not fill this in dev env, use .env instead
  },
  cache: {
    redisURL: process.env.REDIS_URL || "redis://@localhost:6360",
  },
  basicAuth: {
    user: process.env.BASIC_AUTH_USER || "",
    password: process.env.BASIC_AUTH_PASSWORD || "",
  },
  webhooks: {
    contentUrl: process.env.CONTENT_WEBHOOK_URL,
    contentUser: process.env.CONTENT_WEBHOOK_USER,
    contentPassword: process.env.CONTENT_WEBHOOK_PASSWORD,
  },
  stripe: {
    apiKey:
      process.env.STRIPE_API_KEY ||
      "sk_test_51IJbEYGesxfbePZUuH0T6891FLaldtgfufjJOvvPicn9rEHXAdpy5MQufIxUIER6cYWig0YkePmTGJoNEJ3AicBl00uPKeWA3y",
    webhookSecret:
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_c8073d61c36abab4d488d068f065d7a84c468de780722c8e90ad3d9cf1f0b340",
  },
  weather: {
    apiKey: process.env.WEATHER_API_KEY || "1c2e74ddb4456f75a4a48d61a368203b",
    apiBaseUrl: process.env.WEATHER_API_BASE_URL || "https://api.openweathermap.org/data/2.5/",
    iconUrl: process.env.WEATHER_API_BASE_URL || "http://openweathermap.org/img/w/",
  },
  coinmarketcap: {
    apiBaseUrl: process.env.COINMARKETCAP_URL || "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
    apiKey: process.env.COINMARKETCAP_KEY || "9a874839-5e36-4cec-bcbe-ac2f7927c74f",
  },
};
