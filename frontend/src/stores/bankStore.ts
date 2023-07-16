import { defineStore } from "pinia";
import { getBank, getBanks, createBank, updateBank } from "../utils/generated/api-user";
import type { Banks } from "../../types/models";

import { useIndexStore } from "./indexStore";
const indexStore = useIndexStore();

export const useBankStore = defineStore("bankStore", {
  state: () => ({
    banks: [] as Banks[],
    count: 0,
  }),
  actions: {
    async getBanks() {
      const { data } = await getBanks();
      return (this.banks = data);
    },
    async getBank(bankId: string) {
      const res = await getBank(bankId);
      return res.data;
    },
    async createBank(bankData: Banks) {
      try {
        const res = await createBank(bankData);
        this.banks.unshift(bankData);
        return res.data.bank;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateBank(bankData: Banks) {
      try {
        await updateBank(bankData.id, bankData);
        const bankIndex = this.banks.findIndex((item) => item.id === bankData.id);
        if (bankIndex !== -1) {
          this.banks.splice(bankIndex, 1, bankData);
        }
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
  },
});
