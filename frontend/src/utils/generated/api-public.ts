/* eslint-disable no-unused-vars */
import { useOFetch, useOFetchRaw } from "@/plugins/ofetch";

/** @type {OmitThisParameter<import("../../../../backend/api/public/auth.js").signUp>}  */
export async function signUp(body = undefined, query = undefined) {
  return await useOFetch(`/signup`, { method: "POST", body, query });
}
/** @type {OmitThisParameter<import("../../../../backend/api/public/auth.js").signIn>}  */
export async function signIn(body = undefined, query = undefined) {
  return await useOFetch(`/signin`, { method: "POST", body, query });
}
/** @type {OmitThisParameter<import("../../../../backend/api/public/auth.js").refreshToken>}  */
export async function refreshToken(body = undefined, query = undefined) {
  return await useOFetch(`/refresh-token`, { method: "POST", body, query });
}
