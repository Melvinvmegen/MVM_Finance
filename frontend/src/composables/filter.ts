import type { Query } from "../../types/models";

export function useFilter(callbackFn: any) {
  const loadingStore = useLoadingStore();
  const items = ref({
    rows: [],
    count: 0,
  });
  const perPage = 12;

  async function filterAll(filters?: Query) {
    loadingStore.setLoading(true);
    try {
      if (items.value?.rows.length > 0 && filters && !filters.force) return;
      if (!items.value.count || filters?.force) {
        if (filters?.CustomerId) {
          items.value = await callbackFn(filters.CustomerId, {
            currentPage: 1,
            perPage: perPage,
            force: false,
            ...filters,
          });
        } else {
          items.value = await callbackFn({
            currentPage: 1,
            perPage: perPage,
            force: false,
            ...filters,
          });
        }
      }
    } finally {
      loadingStore.setLoading(false);
    }
  }

  return {
    items,
    filterAll,
  };
}
