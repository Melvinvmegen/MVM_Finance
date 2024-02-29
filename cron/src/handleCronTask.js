import { functions } from "../utils/functions.js";
import { database } from "../utils/database.js";
import dayjs from "dayjs";

export async function handleCronTask() {
  console.log("[Cron task] ...Querying cron tasks");
  // TODO: send with file
  const cronTasks = await database
    .select("*")
    .from("cron_task")
    .where("active", "=", 1)
    .andWhere("date", "<=", dayjs().toDate())
    .andWhere("try_counts", "<", 5);

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
      await database("cron_task")
        .where({ id: cronTask.id })
        .update({
          active: !!cronTask.date_interval_value,
          try_counts: 0,
          error_message: null,
          date: dayjs(cronTask.date)
            .add(cronTask.date_interval_value, cronTask.date_interval_type)
            .toDate(),
        });
    } catch (err) {
      console.log(`[Cron task] An error occured`, err);
      const tryCount = (cronTask.try_counts += 1);
      // TODO: if active: false send email to myself
      await database("cron_task")
        .where({ id: cronTask.id })
        .update({
          try_counts: tryCount,
          error_message: err.message,
          ...(tryCount >= 5 && { active: false }),
        });
    }
  }
}
