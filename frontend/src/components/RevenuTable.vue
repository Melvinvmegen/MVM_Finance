<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row(align="center")
    v-col(cols="12" sm="3" md="3")
      v-select(hide-details :items="props.items?.rows" clearable :item-props="itemProps" :label='$t("revenu.search")' v-model="revenuId")
    v-btn.bg-secondary {{ $t("revenus.search") }}

v-col(cols="12")
  v-data-table-server(
    :headers="dataTable.headers"
    :items-length="props.items?.count"
    :items="props.items?.rows"
    :items-per-page="dataTable.perPage"
    :loading="loadingStore.loading"
    @update:options="getRevenus"
    item-value="name"
    )
    template( v-slot:[`item.createdAt`]="{ item }")
      span {{ revenuDate(item) }}
    template( v-slot:[`item.pro`]="{ item }")
      span {{ $n(Math.round(item.pro), "currency") }}
    template( v-slot:[`item.revenuNet`]="{ item }")
      span {{ $n(returnRevenuNet(item), "currency") }}
    template( v-slot:[`item.perso`]="{ item }")
      span {{ $n(Math.round(item.perso), "currency") }}
    template( v-slot:[`item.total`]="{ item }")
      span {{ $n(Math.round(item.total), "currency") }}
    template( v-slot:[`item.investments`]="{ item }")
      span {{ $n(returnInvestmentTotal(item), "currency") }}
    template( v-slot:[`item.expense`]="{ item }")
      span {{ $n(Math.round(item.expense), "currency") }}
    template( v-slot:[`item.vatCollected`]="{ item }")
      span {{ $n(returnTVABalance(item), "currency") }}
    template( v-slot:[`item.balance`]="{ item }")
      span {{ $n(Math.round((returnRevenuNet(item) + item.perso)- Math.abs(item.expense)), "currency") }}
    template(v-slot:item.actions="{ item }")
      v-btn(icon="mdi-pencil" variant="plain" size="small" :to="`/revenus/${item.id}`")
</template>

<script setup lang="ts">
import type { Revenus, Invoices, Costs, Transactions } from "../../types/models";
import dayjs from "dayjs";

type RevenuWithCostsInvoicesTransactions = Revenus & {
  Invoices: Invoices[];
  Costs: Costs[];
  Transactions: Transactions[];
};

const loadingStore = useLoadingStore();

const props = defineProps<{
  items: {
    rows: Array<RevenuWithCostsInvoicesTransactions>;
    count: number;
  };
}>();

const { t: $t } = useI18n();
const dataTable = {
  perPage: 12,
  headers: [
    {
      key: "createdAt",
      value: "createdAt",
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
      sortable: false,
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
      sortable: false,
    },
    {
      key: "expense",
      value: "expense",
      title: $t("revenus.expenses"),
    },
    {
      key: "vatCollected",
      value: "vatCollected",
      title: $t("revenus.vatCollected"),
      sortable: false,
    },
    {
      key: "balance",
      value: "balance",
      title: $t("revenus.balance"),
      sortable: false,
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
    title: dayjs(item.createdAt).format("MMMM YYYY"),
    value: item.id,
  };
}

const emit = defineEmits(["filter"]);
const revenuId = ref();
watch(revenuId, (newId) => {
  emit("filter", {
    id: newId,
    force: true,
  });
});

function getRevenus({ page, itemsPerPage, sortBy }) {
  emit("filter", {
    currentPage: page,
    perPage: itemsPerPage,
    force: true,
    sortBy,
  });
}

function revenuDate(revenu: RevenuWithCostsInvoicesTransactions) {
  if (!revenu) return;
  return dayjs(revenu.createdAt).format("MMMM YYYY");
}

function returnRevenuNet(revenu: RevenuWithCostsInvoicesTransactions) {
  if (revenu.taxPercentage) {
    return Math.round(revenu.pro / (1 + revenu.taxPercentage / 100));
  } else {
    return Math.round(revenu.pro);
  }
}

function returnInvestmentTotal(revenu: RevenuWithCostsInvoicesTransactions) {
  if (revenu.Transactions) {
    const total = revenu.Transactions.reduce((sum, investment) => sum + investment.total, 0);
    return +total.toFixed(2);
  } else {
    return 0;
  }
}

function returnTVABalance(revenu: RevenuWithCostsInvoicesTransactions) {
  const tvaDispatched = revenu.Costs?.reduce((sum, cost) => sum + (cost.tvaAmount || 0), 0);
  const tvaCollected = revenu.Invoices?.reduce((sum, invoice) => sum + invoice.tvaAmount, 0);

  if (revenu.Invoices) {
    return +(tvaDispatched - tvaCollected).toFixed(2);
  } else {
    return 0;
  }
}
</script>
