/* eslint-disable no-unused-vars */
import { useOFetch, useOFetchRaw } from "../../plugins/ofetch";

/**
 * @param {Parameters<import("../../../../backend/api/cron/invoices.js").generatePDF>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/cron/invoices.js").generatePDF>>}
**/
export async function generatePDF(body = undefined, query = undefined) {
  return await useOFetch(`/api/cron/invoices/generate-pdf`, { method: "POST", body, query });
}
/**
 * @param {Parameters<import("../../../../backend/api/cron/stats.js").setUsersStats>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/cron/stats.js").setUsersStats>>}
**/
export async function setUsersStats(body = undefined, query = undefined) {
  return await useOFetch(`/api/cron/stats/users`, { method: "POST", body, query });
}
/**
 * @param {Parameters<import("../../../../backend/api/cron/stats.js").setAssetsStats>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/cron/stats.js").setAssetsStats>>}
**/
export async function setAssetsStats(body = undefined, query = undefined) {
  return await useOFetch(`/api/cron/stats/assets`, { method: "POST", body, query });
}
