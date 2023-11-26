const DELAY_MS = process.env.DELAY_MS || 60000;
const OFFSET_MS = process.env.OFFSET_MS || 0;
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
      console.error("Error during mail sender", err);
    }
  },
  DELAY_MS,
  OFFSET_MS
);
