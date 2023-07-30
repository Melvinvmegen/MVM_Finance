import { defineStore } from "pinia";
import { whoAmI } from "../utils/generated/api-public";

export const useAuthStore = defineStore("auth", () => {
  const me = ref();
  async function authenticate() {
    me.value = await whoAmI();
    return me.value;
  }

  return { me, authenticate };
});
