/* eslint-disable no-console */
import { createClient } from "redis";
import { settings } from "./settings.js";
import { AppError } from "./AppError.js";
import { green, red, yellow } from "colorette";

let redisClient;
async function createRedisClient() {
  redisClient = createClient({ url: settings.cache.redisURL });
  await redisClient.connect();

  redisClient.on("error", function (err) {
    console.debug(red("[CACHE] Redis error :"), red(err));
  });

  redisClient.on("connected", function () {
    console.log(green("[CACHE] Redis is connected"));
  });
}

const getOrSetCache = async (key, cb, force = false) => {
  try {
    const result = await redisClient.get(key);
    if (result && !force) {
      console.log(green(`[CACHE] HIT: ${key}`));
      return JSON.parse(result);
    } else {
      console.log(yellow(`[CACHE] MISS: ${key}`));
      const freshData = await cb();
      redisClient.setEx(key, 3600, JSON.stringify(freshData));
      return freshData;
    }
  } catch (error) {
    new AppError(500, error);
  }
};

const invalidateCache = async (key) => {
  try {
    const result = await redisClient.del(key);
    const message = result ? "[CACHE] INVALIDATED" : "[CACHE] NOT FOUND";
    console.log(green(`${message} ${key}`));
    return result;
  } catch (error) {
    new AppError(500, `[CACHE] ERROR: ${error}`);
  }
};

export { createRedisClient, getOrSetCache, invalidateCache, redisClient };
