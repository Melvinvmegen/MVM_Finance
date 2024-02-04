import { settings } from "./utils/settings.js";
import {
  handleUserStatsTask,
  handleAssetStatsTask,
} from "./src/handleUserStatsTask.js";
import { handleCronTask } from "./src/handleCronTask.js";
import { cron } from "./utils/cron.js";
import dayjs from "dayjs";

await import("dayjs/locale/fr.js");
dayjs.locale("fr");

cron(
  async () => {
    try {
      await handleCronTask();
    } catch (err) {
      console.error("Error during cron execution", err);
    }
  },
  settings.cron.cronDelayMs,
  settings.cron.cronOffsetMS
);

cron(
  async () => {
    try {
      await handleUserStatsTask();
      await handleAssetStatsTask();
    } catch (err) {
      console.error("Error during stats execution", err);
    }
  },
  settings.cron.statsDelayMs,
  settings.cron.statsOffsetMs
);
