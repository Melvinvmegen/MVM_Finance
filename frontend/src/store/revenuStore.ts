import { defineStore } from "pinia";
import revenuService from "../services/revenuService";
import type Revenu from "../types/revenu";
import { useIndexStore } from "./indexStore"
const indexStore = useIndexStore()

export const useRevenuStore = defineStore("revenuStore", {
  state: () => ({
    revenus: [] as Revenu[],
    revenu: undefined as Revenu | undefined,
    count: 0,
  }),
  actions: {
    async getRevenus(query: any) {
      const { data } : { data: { rows: Revenu[], count: string } } = await revenuService.getRevenus(query.BankId, query);
      this.revenus = [...data.rows];
      this.count = +data.count;
      return this.revenus;
    },
    async getRevenu(bankId: string, revenuId: string) {
      this.revenu = this.revenus.find((revenu) => revenu.id === revenuId)
      if (!this.revenu) {
        const res = await revenuService.getRevenu(bankId, revenuId);
        this.revenu = res.data;
      }
      return this.revenu;
    },
    async createRevenu(bankId: string, fileData: File) {
      try {
        await revenuService.createRevenu(bankId, fileData);
        await this.getRevenus({ BankId: 1, currentPage: '1', perPage: '12', force: 'false' });
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateRevenu(revenuData: Revenu) {
      try {
        await revenuService.updateRevenu(revenuData)
        const revenuIndex = this.revenus.findIndex(
          (item) => item.id === revenuData.id
        );
        if (revenuIndex !== -1) {
          this.revenus.splice(
            revenuIndex,
            1,
            revenuData
          );
        }
        return revenuData;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
  }
});