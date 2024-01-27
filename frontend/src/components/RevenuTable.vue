<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row(align="center")
    v-col(cols="12" sm="3" md="3")
      v-select(hide-details :items="props.items?.rows" clearable :item-props="itemProps" :label='$t("revenu.search")' v-model="revenuId" @blur='searchRevenu')
    v-btn.bg-secondary(@click="searchRevenu") {{ $t("revenus.search") }}
    v-icon.ml-2(@click="resetAll()") mdi-restore


v-col(cols="12")
  v-data-table-server(
    :headers="dataTable.headers"
    :items-length="props.items?.count"
    :items="props.items?.rows"
    :items-per-page="dataTable.perPage"
    :page="dataTable.page"
    :sort-by="dataTable.sortBy"
    :loading="loadingStore.loading"
    @update:options="getRevenus"
    item-value="name"
    )
    template( v-slot:[`item.created_at`]="{ item }")
      span {{ revenuDate(item) }}
    template( v-slot:[`item.pro`]="{ item }")
      span {{ $n(Math.round(item.pro), "currency") }}
    template( v-slot:[`item.revenuNet`]="{ item }")
      span {{ $n(Math.round(item.total_net), "currency") }}
    template( v-slot:[`item.perso`]="{ item }")
      span {{ $n(Math.round(item.perso), "currency") }}
    template( v-slot:[`item.total`]="{ item }")
      span {{ $n(Math.round(item.total), "currency") }}
    template( v-slot:[`item.investments`]="{ item }")
      span {{ $n(Math.round(item.investments), "currency") }}
    template( v-slot:[`item.expense`]="{ item }")
      span {{ $n(Math.round(item.expense), "currency") }}
    template( v-slot:[`item.vatBalance`]="{ item }")
      span {{ $n(Math.round(item.tva_balance), "currency") }}
    template( v-slot:[`item.balance`]="{ item }")
      span {{ $n(Math.round(item.balance), "currency") }}
    template(v-slot:item.actions="{ item }")
      v-btn(icon="mdi-pencil" variant="plain" size="small" :to="`/revenus/${item.id}`")
</template>

<script setup lang="ts">
import type { Revenus } from "../../types/models";
import dayjs from "dayjs";

const loadingStore = useLoadingStore();
const searchFrom = ref<HTMLFormElement | null>(null);
const props = defineProps<{
  items: {
    rows: Array<Revenus>;
    count: number;
  };
}>();
const route = useRoute();
const { t: $t } = useI18n();
const dataTable = {
  page: Number(route.query.currentPage) || 1,
  perPage: Number(route.query.perPage) || 12,
  sortBy: [],
  headers: [
    {
      key: "created_at",
      value: "created_at",
      title: $t("revenus.month"),
    },
    {
      key: "pro",
      value: "pro",
      title: $t("revenus.revenuPro"),
    },
    {
      key: "revenuNet",
      value: "revenuNet",
      title: $t("revenus.revenuNet"),
    },
    {
      key: "perso",
      value: "perso",
      title: $t("revenus.revenuPerso"),
    },
    {
      key: "total",
      value: "total",
      title: $t("revenus.revenuTotal"),
    },
    {
      key: "investments",
      value: "investments",
      title: $t("revenus.investments"),
    },
    {
      key: "expense",
      value: "expense",
      title: $t("revenus.expenses"),
    },
    {
      key: "vatBalance",
      value: "vatBalance",
      title: $t("revenus.vatBalance"),
    },
    {
      key: "balance",
      value: "balance",
      title: $t("revenus.balance"),
    },
    {
      key: "actions",
      value: "actions",
      title: "",
      sortable: false,
    },
  ],
};

function itemProps(item) {
  return {
    title: dayjs(item.created_at).format("MMMM YYYY"),
    value: item.id,
  };
}

const emit = defineEmits(["filter"]);
const revenuId = ref();

function searchRevenu() {
  emit("filter", {
    id: revenuId.value,
    force: true,
  });
}

function getRevenus({ page, itemsPerPage, sortBy }) {
  emit("filter", {
    currentPage: page,
    perPage: itemsPerPage,
    sortBy,
    force: true,
  });
}

function revenuDate(revenu: Revenus) {
  if (!revenu) return;
  return dayjs(revenu.created_at).format("MMMM YYYY");
}

function resetAll() {
  searchFrom.value?.reset();
  revenuId.value = null;
  emit("filter", {
    force: true,
  });
}
</script>
