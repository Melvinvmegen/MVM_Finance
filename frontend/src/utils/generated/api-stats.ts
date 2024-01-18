/* eslint-disable no-unused-vars */
import { useOFetch, useOFetchRaw } from "../../plugins/ofetch";

/**
 * @param {Parameters<import("../../../../backend/api/stats/users.js").setUsersStats>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/stats/users.js").setUsersStats>>}
**/
export async function setUsersStats(body = undefined, query = undefined) {
  return await useOFetch(`/api/stats/investment_profiles`, { method: "POST", body, query });
}
