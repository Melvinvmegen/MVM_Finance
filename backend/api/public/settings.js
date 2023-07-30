import { settings } from "../../utils/settings.js";

/**
 * @param {API.ServerInstance} app
 */
export default async function (app) {
  app.$get("/settings", getSettings);
}

export async function getSettings() {
  return {
    weatherApiKey: settings.weather.apiKey,
    weatherApiBaseUrl: settings.weather.apiBaseUrl,
    weatherIconUrl: settings.weather.iconUrl,
  };
}
