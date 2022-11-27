import { createClient } from "redis";
import chalk from "chalk";
import { settings } from "./settings.js";
import { AppError } from "./AppError.js";

const redisClient = createClient({ url: settings.cache.redisURL });

redisClient.on("connected", function () {
  console.log(chalk.green("Redis is connected"));
});
redisClient.on("error", function (err: Error) {
  console.debug(chalk.red("Redis error :"), chalk.red(err));
});

const getOrSetCache = async (key: any, cb: () => any, force = false) => {
  try {    
    // const result = await redisClient.get(key)
    // console.log("cache result", result)
    //   if (result && !force) {
    //     console.log(chalk.green(key, "CACHE HIT"));
    //     return JSON.parse(result);
    //   } else {
    //     const redisKey = force ? `filtered_${key}` : key;
    //     console.log(chalk.yellow(redisKey, "CACHE MISS"));
    //     const freshData = await cb();
    //     redisClient.setEx(redisKey, 3600, JSON.stringify(freshData));
    //     return freshData;
    //   }
    return cb();
  } catch (error) {
    new AppError(500, `Caching error: ${error}`)
  }
};

const invalidateCache = async (key: string) => {
    try {
      const result = await redisClient.del(key)
      const message = result ? "CACHE INVALIDATED" : "CACHE NOT FOUND";
      console.log(chalk.green(key, message));
      return result;
    } catch (error) {
      new AppError(500, `Caching error: ${error}`)
    }
};

export { redisClient, getOrSetCache, invalidateCache };
