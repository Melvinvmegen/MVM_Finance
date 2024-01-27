<template lang="pug">
v-col(cols="12")
  v-data-table-server(
    :headers="dataTable.headers"
    :items-length="props.items?.count"
    :items="props.items?.rows"
    :items-per-page="dataTable.perPage"
    :loading="loadingStore.loading"
    @update:options="getAssets"
    item-value="name"
    )
    template( v-slot:[`item.updated_at`]="{ item }")
      span {{ dayjs(item.updated_at).format("MM/DD/YY") }}
    template( v-slot:[`item.asset_type`]="{ item }")
      span {{ item.asset_type.name }}
    template(v-slot:item.actions="{ item }")
      v-row.flex-nowrap(align="center")
        v-btn(icon="mdi-pencil" variant="plain" size="small" @click="mutable_asset = item")
        v-btn(icon="mdi-delete" variant="plain" size="small" @click.stop="deleteItem(item, $t('assets.confirmDelete', [`${item.name} ${item.created_at}`]) )")

  AssetModal(v-if="mutable_asset" :model="mutable_asset" :show="mutable_asset" @close="mutable_asset = null" :asset-types="props.assetTypes")
</template>

<script setup lang="ts">
import type { asset, Query, asset_type } from "../../types/models";
import { deleteAsset } from "../utils/generated/api-user";
import dayjs from "dayjs";

const { deleteItem } = useDelete(deleteAsset);
const loadingStore = useLoadingStore();
const props = defineProps<{
  items: {
    rows: Array<asset>;
    count: number;
  };
  assetTypes: {
    type: Array<asset_type>;
    required: true;
  };
}>();
let mutable_asset: Ref<asset> = ref();
const { t: $t } = useI18n();
const route = useRoute();
const dataTable = {
  page: Number(route.query.currentPage) || 1,
  perPage: Number(route.query.perPage) || 12,
  sortBy: [],
  headers: [
    {
      key: "updated_at",
      value: "updated_at",
      title: $t("assets.updated_at"),
    },
    {
      key: "name",
      value: "name",
      title: $t("assets.name"),
    },
    {
      key: "asset_type",
      value: "asset_type",
      title: $t("assets.asset_type"),
      sortable: false,
    },
    {
      key: "amount",
      value: "amount",
      title: $t("assets.amount"),
    },
    {
      key: "growth_last_month",
      value: "growth_last_month",
      title: $t("assets.growth_last_month"),
    },
    {
      key: "growth_last_six_months",
      value: "growth_last_six_months",
      title: $t("assets.growth_last_six_months"),
    },
    {
      key: "growth_last_year",
      value: "growth_last_year",
      title: $t("assets.growth_last_year"),
    },
    {
      key: "actions",
      value: "actions",
      sortable: false,
      width: 100,
    },
  ],
};

const emit = defineEmits(["filter"]);
function getAssets({ page, itemsPerPage, sortBy }) {
  emit("filter", {
    currentPage: page,
    perPage: itemsPerPage,
    force: true,
    sortBy,
  });
}
</script>
