import { ofetch } from "ofetch";
import AppError from "../utils/appError";
import { useMessageStore } from "../stores/messageStore";

export function createOFetch(options = { headers: [] }) {
  const _ofetch = ofetch.create({
    ...(options || {}),
    headers: options?.headers || { Sid: useSettingsStore().sid },
    credentials: "include",
    async onRequestError({ error }) {
      useMessageStore().i18nMessage("error", "errors.server.notReachable");
      return Promise.reject(error);
    },
    async onResponseError({ response }) {
      const status = response.status;
      const errorData = response._data.error || response._data;
      if (status === 401) {
        console.log("401 Unauthorized", errorData);
        if (window.location.pathname !== "/logout") window.location.href = "/logout";
      } else if (status === 400) {
        console.log("Bad request", errorData);
        if (errorData.name === "AppError") {
          useMessageStore().i18nMessage("error", errorData.message, errorData.params);
        } else {
          useMessageStore().i18nMessage("error", "errors.server.validation");
        }
      } else if (status === 500) {
        if (console && console.log) console.log("Technical error", errorData);
        useMessageStore().i18nMessage("error", "errors.server.technical");
      } else {
        if (console && console.log) console.log("Unexpected error", status, errorData);
        useMessageStore().i18nMessage("error", "errors.server.unexpected");
      }

      let returnedError = errorData;
      if (returnedError && !(returnedError instanceof Error)) {
        if (returnedError.name === "AppError") {
          returnedError = new AppError(returnedError.message, returnedError.params);
        }
      }
      throw returnedError;
    },
  });

  window["ofetch"] = _ofetch;
  return _ofetch;
}

export const useOFetch = async function (url: string, options: any) {
  return await window["ofetch"](url, options);
};

export const useOFetchRaw = async function (url: string, options: any) {
  return await window["ofetch"].raw(url, options);
};
