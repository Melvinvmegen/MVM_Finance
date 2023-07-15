import { defineStore } from "pinia";
import bankService from "../services/bankService";
import type Bank from "../types/bank";
import { useIndexStore } from "./indexStore"
const indexStore = useIndexStore()

export const useBankStore = defineStore("bankStore", {
  state: () => ({
    banks: [] as Bank[],
    count: 0,
  }),
  actions: {
    async getBanks() {
      const { data } = await bankService.getBanks();
      return this.banks = data;
    },
    async getBank(bankId: string) {
      const res = await bankService.getBank(bankId);
      return res.data;
    },
    async createBank(bankData: Bank) {
      try {
        const res = await bankService.createBank(bankData);
        this.banks.unshift(bankData);
        return res.data.bank;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateBank(bankData: Bank) {
      try {
        await bankService.updateBank(bankData)
        const bankIndex = this.banks.findIndex(
          (item) => item.id === bankData.id
        );
        if (bankIndex !== -1) {
          this.banks.splice(
            bankIndex,
            1,
            bankData
          );
        }
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
  }
});