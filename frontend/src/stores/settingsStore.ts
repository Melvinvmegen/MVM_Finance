import { nanoid } from "nanoid";
import { defineStore } from "pinia";
import { getSettings } from "../utils/generated/api-public";

export const useSettingsStore = defineStore("settings", () => {
  /** @type {Ref<Awaited<ReturnType<typeof import("./utils/generated/api-public").getSettings>>>} */
  const settings = ref(null);
  /** @type {Ref<string>} */
  const sid = ref(nanoid(5));

  async function initializeSettings() {
    settings.value = await getSettings();
  }

  return {
    settings,
    sid,
    initializeSettings,
  };
});
