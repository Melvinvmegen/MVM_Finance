<template lang="pug">
v-row
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") Revenus
          v-spacer
          v-col(cols="1")
            v-btn(icon="mdi-plus" @click="triggerUpload" color="primary")
            input.mr-2(type="file" id="csv" name="csv" accept=".csv" style="display:none;" @change="uploadFile")

      v-card-text
        revenu-table
  v-col(cols="12" md="4")
    v-card(position="absolute" class="v-col v-col-3")
      v-card-text
        v-row(justify="space-around" align="center")
          v-card-subtitle Chiffre d'affaires
          v-card-title {{ returnRevenuTotal() }} €
        v-row(justify="space-around" align="center")
          v-card-subtitle Dépenses totales
          v-card-title {{ returnRevenusCostTotal() }} €
        v-row(justify="space-around" align="center")
          v-card-subtitle Impôts
          v-card-title {{ - returnTaxAmount() }} €
        hr.mx-2.my-4
        v-row(justify="space-around" align="center")
          v-card-subtitle Résultat Net
          v-card-title {{ Math.round(returnRevenuTotal() + returnRevenusCostTotal() - returnTaxAmount()) }} €
      hr.mx-2.my-4
      v-card-text
        v-row(justify="space-around" align="center")
          v-card-subtitle Dépense mensuel moyenne :
          v-card-title {{ returnExpenseAverage() }} €
        bar(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
        hr.mx-2.my-4
        v-row(justify="space-around" align="center")
          v-card-subtitle Revenu mensuel moyen :
          v-card-title {{ returnRevenuAverage() }} €
        bar(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')
</template>

<script setup lang="ts">
import { computed } from "vue";
import revenuTable from "../../components/revenu/revenuTable.vue";
import { useIndexStore } from "../../store/indexStore";
import { useRevenuStore } from "../../store/revenuStore";
import { useBankStore } from "../../store/bankStore";
import Bar from "../../components/general/barChart.vue";

const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
const bankStore = useBankStore();

if (!bankStore.banks.length) {
  bankStore.getBanks();
}

const costChartData = computed(() => {
  const reversed_revenus = revenuStore.revenus.slice().reverse();
  const chartData = {
    labels: reversed_revenus.map((revenu) => {
      const date = new Date(revenu.createdAt);
      return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    }),
    datasets: [
      {
        label: "",
        data: [],
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4"],
      },
    ],
  };
  for (let revenu of reversed_revenus) {
    chartData.datasets[0].data.push(revenu.expense);
  }

  return chartData;
});
const creditChartData = computed(() => {
  const reversed_revenus = revenuStore.revenus.slice().reverse();
  const chartData = {
    labels: reversed_revenus.map((revenu) => {
      const date = new Date(revenu.createdAt);
      return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    }),
    datasets: [
      {
        label: "",
        data: [],
        backgroundColor: ["#FD7F20", "#FC2E20", "#FDB750", "#010100"],
      },
    ],
  };
  chartData.datasets[0].data.push
  for (let revenu of reversed_revenus) {
    chartData.datasets[0].data.push(revenu.total);
  }
  return chartData;
});
const chartOptions = {
  responsive: true,
};

function triggerUpload() {
  document.getElementById("csv").click();
}

async function uploadFile(event) {
  indexStore.setLoading(true);
  try {
    const form = new FormData();
    form.append("file", event.target.files[0]);
    const bankId = bankStore.banks?.[0].id || 1;
    await revenuStore.createRevenu(bankId, form);
  } finally {
    indexStore.setLoading(false);
  }
}

function returnRevenuTotal() {
  if (revenuStore.revenus) {
    const totals = revenuStore.revenus.reduce((sum: number, revenu: Revenu) => sum + revenu.total, 0);
    return Math.round(totals);
  } else {
    return 0;
  }
}

function returnRevenusCostTotal() {
  if (!revenuStore.revenus.length) return 0;
  let total = 0;
  for (let revenu of revenuStore.revenus) {
    if (revenu.Costs) {
      total += revenu.Costs.reduce((sum, cost) => sum + cost.total, 0);
    }
  }
  return Math.round(total);
}

function returnTaxAmount() {
  // Abattement de 30% avant impots sur le CA
  const taxable_income = returnRevenuTotal() / 1.3;
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
  const total_expense = revenuStore.revenus.reduce((sum: number, revenu: Revenu) => sum - revenu.expense, 0);
  return Math.round(total_expense / revenuStore.revenus.length);
}

function returnRevenuAverage() {
  const total_revenu = revenuStore.revenus.reduce((sum: number, revenu: Revenu) => sum + revenu.total, 0);
  return Math.round(total_revenu / revenuStore.revenus.length);
}
</script>