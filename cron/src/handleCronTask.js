import { functions } from "../utils/functions.js";
import { database } from "../utils/database.js";
import dayjs from "dayjs";

export async function handleCronTask() {
  console.log("[Cron task] ...Querying cron tasks");
  // TODO: send with file
  const cronTasks = await database
    .select("*")
    .from("CronTask")
    .where("active", "=", 1)
    .andWhere("date", "<=", dayjs().toDate())
    .andWhere("tryCounts", "<", 5);

  if (cronTasks.length) {
    console.log(`[Cron task] Found ${cronTasks.length} cronTasks to handle`);
  } else {
    console.log(`[Cron task] 0 cronTasks to handle`);
  }

  for (let cronTask of cronTasks) {
    try {
      if (cronTask.params) {
        const params =
          typeof cronTask.params === "string"
            ? JSON.parse(cronTask.params)
            : cronTask.params;
        await functions[cronTask.function](...Object.values(params));
      } else {
        await functions[cronTask.function]();
      }
      await database("CronTask")
        .where({ id: cronTask.id })
        .update({
          active: !!cronTask.dateIntervalValue,
          tryCounts: 0,
          errorMessage: null,
          date: dayjs(cronTask.date)
            .add(cronTask.dateIntervalValue, cronTask.dateIntervalType)
            .toDate(),
        });
    } catch (err) {
      console.log(`[Cron task] An error occured`, err);
      const tryCount = (cronTask.tryCounts += 1);
      // TODO: if active: false send email to myself
      await database("CronTask")
        .where({ id: cronTask.id })
        .update({
          tryCounts: tryCount,
          errorMessage: err.message,
          ...(tryCount >= 5 && { active: false }),
        });
    }
  }
}
