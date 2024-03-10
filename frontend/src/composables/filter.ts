import type { Query } from "../../types/models";

export function useFilter(callbackFn: any) {
  const loadingStore = useLoadingStore();
  const route = useRoute();
  const router = useRouter();

  const items = ref({
    rows: [],
    count: 0,
  });

  async function filterAll(filters?: Query) {
    const navigation_state = {
      currentPage: filters?.currentPage ? "" + filters?.currentPage : "1",
      perPage: filters?.perPage ? "" + filters?.perPage : "10",
      force: filters?.force ? "" + filters?.force : "false",
      sortBy: filters?.sortBy ? JSON.stringify(filters?.sortBy) : null,
    };
    const new_state = JSON.stringify(navigation_state);
    const old_state = JSON.stringify(route.query);

    if (old_state != new_state) {
      router.replace({
        query: navigation_state,
      });
    }

    loadingStore.setLoading(true);
    try {
      if (items.value?.rows.length > 0 && filters && !filters.force) return;
      if (!items.value.count || filters?.force) {
        if (filters?.customer_id) {
          items.value = await callbackFn(filters.customer_id, {
            ...navigation_state,
            ...filters,
          });
        } else {
          items.value = await callbackFn({
            ...navigation_state,
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
