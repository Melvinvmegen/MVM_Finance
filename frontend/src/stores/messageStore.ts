import { defineStore } from "pinia";
interface Message {
  type: string;
  key?: string;
  params?: string;
  timeout?: number;
  message?: string;
}

export const useMessageStore = defineStore("message", () => {
  const messages: Message[] = reactive([]);
  function success(message: string) {
    messages.push({
      type: "success",
      timeout: 4000,
      message,
    });
  }
  function error(message: string) {
    messages.push({
      type: "error",
      message: message,
    });
  }
  function warning(message: string) {
    messages.push({
      type: "warning",
      message: message,
    });
  }
  function info(message: string) {
    messages.push({
      type: "info",
      message: message,
      timeout: 6000,
    });
  }
  function i18nMessage(type: string, key: string, params: string = "", timeout: number = 4000) {
    messages.push({
      type,
      key,
      params,
      timeout,
    });
  }
  return { messages, success, error, warning, info, i18nMessage };
});
