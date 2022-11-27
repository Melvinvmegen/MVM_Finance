<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row
    v-col(cols="12" sm="3" md="2")
      v-select(:items="revenus" variant="outlined" clearable item-title="createdAt" item-value="id" name='revenuId' v-model="query.id" label='Revenu' density="compact" @blur='filterAll(itemName, true)')

    v-col(cols="12" sm="3" md="2")
      v-btn.bg-secondary Rechercher

    v-col(cols="12" sm="3" md="2")
      span.font-weight-bold Chiffre d'affaires :
      br
      span {{ returnRevenuPro() }}

    v-col(cols="12" sm="3" md="2")
      span.font-weight-bold Résultat Net :
      br
      span {{ returnResult() }}

    v-col(cols="12" sm="3" md="2")
      span.font-weight-bold impôts :
      br
      span {{ returnTaxAmount() }}

    v-col(cols="12" sm="3" md="2")
      span.font-weight-bold Dépense mensuel moyenne :
      br
      span {{ returnExpenseAverage() }}

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
import type Customer from "../../types/Customer";
import { useRouter } from "vue-router";
import { ref, watch, onUnmounted } from "vue";
import { useIndexStore } from "../../store/indexStore.ts";
import { useRevenuStore } from "../../store/revenuStore.ts";

const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
const { compute, filterAll, query } = useFilter(revenuStore, "revenus");
query.id = undefined;
const itemName = "Revenus";
const router = useRouter();
const { items, pages } = compute;
const searchFrom = ref(null);
const file = ref('');

filterAll(itemName).then(() => {
  if (!revenuStore.revenus.length) {
    revenuStore.revenus.value = items.value
  }
});

function pushToShow(event, revenu: Revenu) {
  if (event.target.nodeName !== "TD") return
  router.push(`/revenus/edit/${revenu.id}`);
}

function revenuDate(revenu: Revenu) {
  const date = new Date(revenu.createdAt);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function returnRevenuPro() {
  if (items.value) {
    const totals = items.value.reduce(
      (sum: number, revenu: Revenu) => sum + revenu.pro,
      0
    );
    return totals.toFixed(2);
  } else {
    return 0;
  }
}

function returnRevenuNet(revenu: Revenu) {
  if (revenu.taxPercentage) {
    return Math.round(revenu.pro / (1 + revenu.taxPercentage / 100));
  } else {
    return Math.round(revenu.pro);
  }
}

function returnResult() {
  let totalCost = 0;
  const totalRevenu = items.value.reduce(
    (sum: number, revenu: Revenu) => sum + revenu.total,
    0
  );
  items.value.forEach((revenu: Revenu) => {
    totalCost += +returnCostTotal(revenu);
  });

  return Math.round(totalRevenu - Math.abs(totalCost));
}

function returnCostTotal(revenu: Revenu) {
  if (revenu.Costs) {
    const total = revenu.Costs.reduce((sum, cost) => sum + cost.total, 0)
    return total.toFixed(2);
  } else {
    return 0;
  }
}

function returnInvestmentTotal(revenu: Revenu) {
  if (revenu.Transactions) {
    const total = revenu.Transactions.reduce(
      (sum, investment) => sum + investment.total,
      0
    );
    return total.toFixed(2) 
  } else {
    return 0;
  }
}

function returnTVABalance(revenu: Revenu) {
  const tvaDispatched = revenu.Costs?.reduce(
    (sum, cost) => sum + cost.tvaAmount,
    0
  );
  const tvaCollected = revenu.Invoices?.reduce(
    (sum, invoice) => sum + invoice.tvaAmount,
    0
  );

  if (revenu.Invoices) {
    return (tvaDispatched - tvaCollected).toFixed(2);
  } else {
    return 0;
  }
}

function returnTaxAmount() {
  // Abattement de 30% avant impots sur le CA
  const taxable_income = returnRevenuPro() / 1.3;
  // Pas d'impôts jusqu'à 10 225€
  const first_cap = 10226;
  // 11% entre 10 226€ & 26 070€
  const cap_first_batch = 26070;
  // On passe au cap au dessus soit 26 071€
  const second_cap = cap_first_batch + 1;
  // 30 % entre 26 071€ & 74 545€, Au delà faut prendre un comptable sinon ça va chier
  let tax_total = 0;
  if (taxable_income >= first_cap && taxable_income < cap_first_batch) {
    tax_total = (taxable_income - first_cap) * 0.11;
  } else if (taxable_income >= second_cap) {
    const tax_first_batch = (cap_first_batch - first_cap) * 0.11;
    const tax_second_batch = (taxable_income - second_cap) * 0.3;
    tax_total = tax_first_batch + tax_second_batch;
  }
  return Math.round(tax_total);
}

function returnExpenseAverage() {
  const total_expense = items.value.reduce(
    (sum: number, revenu: Revenu) => sum - revenu.expense,
    0
  );

  const total_refund = items.value.reduce(
    (sum: number, revenu: Revenu) => sum + revenu.refund,
    0
  );

  return Math.round((total_expense - total_refund) / items.value.length);
}

onUnmounted(() => {
  items.value = null;
})
</script>
