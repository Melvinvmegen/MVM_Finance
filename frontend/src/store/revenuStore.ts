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
      this.revenus = [];
      const { data } : { data: { rows: Revenu[], count: string } } = await revenuService.getRevenus(query);
      this.revenus = data.rows;
      this.count = +data.count;
      return this.revenus;
    },
    async getRevenu(revenuId: string) {
      this.revenu = undefined;
      this.revenu = this.revenus.find((revenu) => revenu.id === revenuId)
      if (!this.revenu) {
        const res = await revenuService.getRevenu(revenuId);
        this.revenu = res.data;
      }
      return this.revenu;
    },
    async createRevenu(fileData: File) {
      try {
        await revenuService.createRevenu(fileData);
        const res = await this.getRevenus({ currentPage: '1', perPage: '12', force: 'false' });
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