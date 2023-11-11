import dayjs from "dayjs";
import { redisClient } from "./cacheManager.js";
import UnauthorizedError from "./unauthorizedError.js";

const WINDOW_SIZE_IN_HOURS = 24;
const MAX_WINDOW_REQUEST_COUNT = 10;
const WINDOW_LOG_INTERVAL_IN_HOURS = 1;

export const rateLimiter = async (request) => {
  if (!redisClient) throw new Error("Redis client does not exist!");
  const record = await redisClient.get(request.ip);
  const currentRequestTime = dayjs();
  if (record == null) {
    let newRecord = [
      {
        requestTimeStamp: currentRequestTime.unix(),
        requestCount: 1,
      },
    ];
    await redisClient.set(request.ip, JSON.stringify(newRecord));
  } else {
    const data = JSON.parse(record);
    const windowStartTimestamp = dayjs().subtract(WINDOW_SIZE_IN_HOURS, "hours").unix();
    const requestsWithinWindow = data.filter((entry) => {
      return entry.requestTimeStamp > windowStartTimestamp;
    });
    const totalWindowRequestsCount = requestsWithinWindow.reduce((accumulator, entry) => {
      return accumulator + entry.requestCount;
    }, 0);

    if (totalWindowRequestsCount >= MAX_WINDOW_REQUEST_COUNT) {
      throw new UnauthorizedError("errors.server.unauthorized");
    } else {
      let lastRequestLog = data[data.length - 1];
      let potentialCurrentWindowIntervalStartTimeStamp = currentRequestTime
        .subtract(WINDOW_LOG_INTERVAL_IN_HOURS, "hours")
        .unix();
      if (lastRequestLog.requestTimeStamp > potentialCurrentWindowIntervalStartTimeStamp) {
        lastRequestLog.requestCount++;
        data[data.length - 1] = lastRequestLog;
      } else {
        data.push({
          requestTimeStamp: currentRequestTime.unix(),
          requestCount: 1,
        });
      }
      await redisClient.set(request.ip, JSON.stringify(data));
    }
  }
};
