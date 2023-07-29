interface Query {
  currentPage: number;
  perPage: number;
  id?: number;
  month?: number;
  filter?: string;
  total?: number;
  phone?: string;
  name?: string;
  email?: string;
  city?: string;
  force?: boolean;
}

export function useFilter(items: any, callbackFn: (query: Query) => void, additionalFilters = {}) {
  const loadingStore = useLoadingStore();
  const query = reactive<Query>({
    currentPage: 1,
    perPage: 12,
  });

  if (additionalFilters) {
    for (const filter in additionalFilters) {
      query[filter] = additionalFilters[filter];
    }
  }

  const compute = {
    items: computed(() => items),
    pages: computed(() => Math.ceil(items.length / query.perPage)),
  };

  watch(
    () => query.currentPage,
    () => filterAll(true),
  );

  async function filterAll(force = false, additionalFilters = {}) {
    loadingStore.setLoading(true);
    try {
      if (compute.items.value?.length > 0 && !force && !("CustomerId" in query)) return;
      if (additionalFilters) {
        for (const filter in additionalFilters) {
          query[filter] = additionalFilters[filter];
        }
      }
      query.force = force;
      await callbackFn(query);
      return Promise.resolve("Success");
    } finally {
      loadingStore.setLoading(false);
    }
  }

  return {
    compute,
    filterAll,
    query,
  };
}
