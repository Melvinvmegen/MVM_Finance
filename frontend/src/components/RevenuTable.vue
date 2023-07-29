<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row
    v-col(cols="12" sm="3" md="2")
      v-select(:items="items"  clearable item-title="createdAt" item-value="id" name='revenuId' v-model="query.id" :label='$t("revenu.search")'  @blur='filterAll(true)')

    v-col(cols="12" sm="3" md="2")
      v-btn.bg-secondary {{ $t("revenus.search") }}

v-col(cols="12")
  v-table(v-if="!loadingStore.loading")
    thead
      tr
        th.text-left
          | {{ $t("revenus.month") }}
        th.text-left
          | {{ $t("revenus.revenuPro") }}
        th.text-left
          | {{ $t("revenus.revenuNet") }}
        th.text-left
          | {{ $t("revenus.revenuPerso") }}
        th.text-left
          | {{ $t("revenus.title") }}
        th.text-left
          | {{ $t("revenus.investments") }}
        th.text-left
          | {{ $t("revenus.expenses") }}
        th.text-left
          | {{ $t("revenus.vatCollected") }}
        th.text-left
          | {{ $t("revenus.balance") }}

    tbody
      tr(v-for='revenu in items' :key='revenu.id' @click='pushToShow($event, revenu)')
        td {{ revenuDate(revenu) }}
        td {{ $n(Math.round(revenu.pro), "currency") }}
        td {{ $n(returnRevenuNet(revenu), "currency") }}
        td {{ $n(Math.round(revenu.perso), "currency") }}
        td {{ $n(Math.round(revenu.total), "currency") }}
        td {{ $n(returnInvestmentTotal(revenu), "currency") }}
        td {{ $n(Math.round(revenu.expense), "currency") }}
        td {{ $n(returnTVABalance(revenu), "currency") }}
        td {{ $n(Math.round((returnRevenuNet(revenu) + revenu.perso)- Math.abs(revenu.expense)), "currency") }}

v-pagination(v-model="query.currentPage" :total-visible='query.perPage' :length='pages')
</template>

<script setup lang="ts">
import type { Revenus, Invoices, Costs, Transactions, Banks } from "../../types/models";
import { getBanks, getRevenus } from "../utils/generated/api-user";
type RevenuWithCostsInvoicesTransactions = Revenus & {
  Invoices: Invoices[];
  Costs: Costs[];
  Transactions: Transactions[];
};

let banks: Banks[] = reactive([]);
const loadingStore = useLoadingStore();
const { compute, filterAll, query } = useFilter([], () => getRevenus());
query.id = undefined;

const router = useRouter();
const { items, pages } = compute;
const searchFrom = ref(null);

onBeforeMount(async () => {
  banks = await getBanks();
  await filterAll(true, {
    BankId: banks[0]?.id,
  });
});

function pushToShow(event, revenu: RevenuWithCostsInvoicesTransactions) {
  if (event.target.nodeName !== "TD") return;
  router.push(`/revenus/edit/${revenu.id}?bankId=${revenu.BankId}`);
}

function revenuDate(revenu: RevenuWithCostsInvoicesTransactions) {
  const date = new Date(revenu.createdAt);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
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
    return total.toFixed(2);
  } else {
    return 0;
  }
}

function returnTVABalance(revenu: RevenuWithCostsInvoicesTransactions) {
  const tvaDispatched = revenu.Costs?.reduce((sum, cost) => sum + cost.tvaAmount, 0);
  const tvaCollected = revenu.Invoices?.reduce((sum, invoice) => sum + invoice.tvaAmount, 0);

  if (revenu.Invoices) {
    return (tvaDispatched - tvaCollected).toFixed(2);
  } else {
    return 0;
  }
}
</script>
