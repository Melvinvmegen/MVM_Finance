/* eslint-disable no-unused-vars */
import { useOFetch, useOFetchRaw } from "@/plugins/ofetch";

/**
 * @param {Parameters<import("../../../../backend/api/public/auth.js").signUp>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/public/auth.js").signUp>>}
**/
export async function signUp(body = undefined, query = undefined) {
  return await useOFetch(`/signup`, { method: "POST", body, query });
}
/**
 * @param {Parameters<import("../../../../backend/api/public/auth.js").signIn>[0]} body
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/public/auth.js").signIn>>}
**/
export async function signIn(body = undefined, query = undefined) {
  return await useOFetch(`/signin`, { method: "POST", body, query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/public/auth.js").logout>>}
**/
export async function logout(query = undefined) {
  return await useOFetch(`/logout`, { method: "GET", query });
}
/**
 * @param {Record<string,string|string[]|number>} [query]
 * @returns {Promise<ReturnType<import("../../../../backend/api/public/auth.js").whoAmI>>}
**/
export async function whoAmI(query = undefined) {
  return await useOFetch(`/who-am-i`, { method: "GET", query });
}
