const DELAY_MS = process.env.DELAY_MS || 60000;
const OFFSET_MS = process.env.OFFSET_MS || 0;
import { handleUserStatsTask } from "./src/handleUserStatsTask.js";
import { handleCronTask } from "./src/handleCronTask.js";
import { cron } from "./utils/cron.js";
import dayjs from "dayjs";

await import("dayjs/locale/fr.js");
dayjs.locale("fr");

cron(
  async () => {
    try {
      await handleCronTask();
      await handleUserStatsTask();
    } catch (err) {
      console.error("Error during cron execution", err);
    }
  },
  DELAY_MS,
  OFFSET_MS
);
