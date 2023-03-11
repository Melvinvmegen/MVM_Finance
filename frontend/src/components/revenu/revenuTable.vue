<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row
    v-col(cols="12" sm="3" md="2")
      v-select(:items="revenuStore.revenus" variant="outlined" clearable item-title="createdAt" item-value="id" name='revenuId' v-model="query.id" label='Revenu' density="compact" @blur='filterAll(itemName, true)')

    v-col(cols="12" sm="3" md="2")
      v-btn.bg-secondary Rechercher

v-col(cols="12")
  v-table(v-if="!indexStore.loading")
    thead
      tr
        th.text-left
          | Mois
        th.text-left
          | Revenus Pro
        th.text-left
          | Revenu Net
        th.text-left
          | Revenus Perso
        th.text-left
          | Revenus
        th.text-left
          | Investissements
        th.text-left
          | Charges
        th.text-left
          | TVA récoltée
        th.text-left
          | Balance

    tbody
      tr(v-for='revenu in items' :key='revenu.id' @click='pushToShow($event, revenu)')
        td {{ revenuDate(revenu) }}
        td {{ Math.round(revenu.pro) }}
        td {{ returnRevenuNet(revenu) }}
        td {{ Math.round(revenu.perso) }}
        td {{ Math.round(revenu.total) }}
        td {{ returnInvestmentTotal(revenu) }}
        td {{ Math.round(revenu.expense) }}
        td {{ returnTVABalance(revenu) }}
        td {{ Math.round((returnRevenuNet(revenu) + revenu.perso)- Math.abs(revenu.expense)) }}

v-pagination(v-model="query.currentPage" :total-visible='query.perPage' :length='pages')
</template>

<script setup lang="ts">
import useFilter from "../../hooks/filter";
import type Revenu from "../../types/Revenu";
import { useRouter } from "vue-router";
import { ref, onUnmounted, onBeforeMount } from "vue";
import { useIndexStore } from "../../store/indexStore";
import { useRevenuStore } from "../../store/revenuStore";
import { useBankStore } from "../../store/bankStore";

const bankStore = useBankStore();
const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
const { compute, filterAll, query } = useFilter(revenuStore, "revenus");
query.id = undefined;

const itemName = "Revenus";
const router = useRouter();
const { items, pages } = compute;
const searchFrom = ref(null);

onBeforeMount(async () => {
  if (!bankStore.$state.banks.length) await bankStore.getBanks();
  if (!revenuStore.revenus.length) {
    await filterAll("Revenus", true, {
      BankId: bankStore.$state.banks[0]?.id,
    });
    revenuStore.revenus.value = items.value;
  }
});

function pushToShow(event, revenu: Revenu) {
  if (event.target.nodeName !== "TD") return;
  router.push(`/revenus/edit/${revenu.id}?bankId=${revenu.BankId}`);
}

function revenuDate(revenu: Revenu) {
  const date = new Date(revenu.createdAt);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function returnRevenuNet(revenu: Revenu) {
  if (revenu.taxPercentage) {
    return Math.round(revenu.pro / (1 + revenu.taxPercentage / 100));
  } else {
    return Math.round(revenu.pro);
  }
}

function returnInvestmentTotal(revenu: Revenu) {
  if (revenu.Transactions) {
    const total = revenu.Transactions.reduce((sum, investment) => sum + investment.total, 0);
    return total.toFixed(2);
  } else {
    return 0;
  }
}

function returnTVABalance(revenu: Revenu) {
  const tvaDispatched = revenu.Costs?.reduce((sum, cost) => sum + cost.tvaAmount, 0);
  const tvaCollected = revenu.Invoices?.reduce((sum, invoice) => sum + invoice.tvaAmount, 0);

  if (revenu.Invoices) {
    return (tvaDispatched - tvaCollected).toFixed(2);
  } else {
    return 0;
  }
}

onUnmounted(() => {
  items.value = null;
});
</script>
