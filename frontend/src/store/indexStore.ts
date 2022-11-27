import { defineStore } from "pinia";

export const useIndexStore = defineStore("indexStore", {
  state: () => ({
    loading: false as boolean,
    error: null as null | string,
  }),
  actions: {
    setLoading(val: boolean): void {
      this.loading = val;
    },
    setError(val: string): void {
      this.error = val;
    }
  },
})