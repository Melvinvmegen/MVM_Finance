import { useIndexStore } from "../store/indexStore";
import { computed, watch, reactive } from "vue";

interface Query {
  currentPage: number;
  perPage: number;
  month?: number;
  filter?: string;
  total?: number;
  phone?: string;
  name?: string;
  email?: string;
  city?: string;
  force?: boolean;
}

export function useFilter(store: any, itemName: string, additionalFilters = {}) {
  const indexStore = useIndexStore();
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
    items: computed(() => store[itemName]),
    pages: computed(() => Math.ceil(store.count / query.perPage)),
  };

  watch(
    () => query.currentPage,
    () => filterAll(itemName, true),
  );

  async function filterAll(itemName: string, force = false, additionalFilters = {}) {
    indexStore.setLoading(true);
    try {
      if (compute.items.value?.length > 0 && !force && !("CustomerId" in query)) return;
      if (additionalFilters) {
        for (const filter in additionalFilters) {
          query[filter] = additionalFilters[filter];
        }
      }
      query.force = force;
      await store[`get${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`](query);
      return Promise.resolve("Success");
    } finally {
      indexStore.setLoading(false);
    }
  }

  return {
    compute,
    filterAll,
    query,
  };
}
