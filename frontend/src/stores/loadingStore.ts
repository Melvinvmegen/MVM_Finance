import { defineStore } from "pinia";

export const useLoadingStore = defineStore("loading", () => {
  const loading = ref(false);
  function setLoading(value: boolean) {
    loading.value = value;
  }
  return { loading, setLoading };
});
