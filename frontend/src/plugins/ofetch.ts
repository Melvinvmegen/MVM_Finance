import { ofetch } from "ofetch";
import AppError from "../utils/appError";

export function createOFetch(options) {
  const _ofetch = ofetch.create({
    ...(options || {}),
    headers: options?.headers || { Sid: useSettingsStore().sid },
    credentials: "include",
    async onRequestError({ error }) {
      return Promise.reject(error);
    },
    async onResponseError({ response }) {
      const status = response.status;
      const errorData = response._data.error || response._data;
      if (status === 401) {
        console.log("401 Unauthorized", errorData);
        window.location.href = "/login";
      } else if (status === 400) {
        console.log("Bad request", errorData);
      } else if (status === 500) {
        console.log("Technical error", errorData);
      } else {
        console.log("Unexpected error", status, errorData);
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
