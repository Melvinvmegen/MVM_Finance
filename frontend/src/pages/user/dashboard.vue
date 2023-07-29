<template lang="pug">
div
  v-row
    v-col(cols="12" md="4")
      v-card(elevation="3")
        v-card-title
          v-col.text-uppercase(cols="11") {{ $t("dashboard.costs") }} ({{ revenuDate(revenu) }})
        v-card-text
          BarChart(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
    v-col(cols="12" md="4")
      v-card(elevation="3")
        v-card-title
          v-col.text-uppercase(cols="11") {{ $t("dashboard.revenus") }} ({{ revenuDate(revenu) }})
        v-card-text
          BarChart(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')
    v-col(cols="12" md="4")
      Weather

  v-row  
    v-col(cols="12" md="8")
      v-card(elevation="3")
        v-card-title
          v-col.text-uppercase(cols="11") {{ $t("dashboard.evolution") }} ({{ revenuDate(revenu) }})
        v-card-text
          LineChart(v-if="lineChartData" :chart-data='lineChartData' :chart-options='chartOptions')
    v-col(cols="12" md="4")
      v-card(class="v-col mt-4")
        v-card-text
          v-row(justify="space-around" align="center" v-if="revenu?.pro")
            v-card-subtitle {{ $t("dashboard.revenuPro") }}
            v-card-title {{ $n(revenu?.pro, "currency") }}
          v-row(justify="space-around" align="center" v-if="revenu?.perso")
            v-card-subtitle {{ $t("dashboard.revenuPerso") }}
            v-card-title + {{ $n(revenu?.perso, "currency") }}
          v-row(justify="space-around" align="center" v-if="revenu?.refund")
            v-card-subtitle {{ $t("dashboard.refund") }}
            v-card-title + {{ $n(revenu?.refund, "currency") }}
          v-row(justify="space-around" align="center" v-if="revenu?.tva_collected")
            v-card-subtitle {{ $t("dashboard.vatCollected") }}
            v-card-title + {{ $n(revenu?.tva_collected, "currency") }}
          v-row(justify="space-around" align="center" v-if="revenu?.tva_dispatched")
            v-card-subtitle {{ $t("dashboard.vatDeducted") }}
            v-card-title {{ - $n(revenu?.tva_dispatched, "currency") }}
          v-row(justify="space-around" align="center" v-if="revenu?.expense")
            v-card-subtitle {{ $t("dashboard.costs") }}
            v-card-title {{ $n(revenu?.expense, "currency") }}
          hr.mx-2.my-4
          v-row(justify="space-around" align="center")
            v-card-subtitle {{ $t("dashboard.balance") }}
            v-card-title {{ $n(revenu?.total + revenu?.expense, "currency") }}
      v-card(class="v-col mt-4")
        v-card-text(v-for="bank in bankStore.$state.banks" :key="bank.id")
          v-card-subtitle.text-h6 {{ bank.name }}
          br
          v-card-title
            .d-flex.justify-center.align-center
              .text-h4.mr-2 {{ $n(bank.amount + (revenu?.total + revenu?.expense), "currency") }}
              v-icon(:class="[(revenu?.total + revenu?.expense) > 0 ? 'text-success' : 'text-red']") mdi-chart-line-variant 
              .text-subtitle-1.mr-2 {{ +(((revenu?.total + revenu?.expense) / bank.amount) * 100).toFixed(2) }}%
          br
          p.text-overline.text-decoration-underline.text-right(@click="show_modal = true") {{ $t("dashboard.editBank") }}
        v-card-text(v-if="!bankStore.$state.banks.length")
          v-card-subtitle.text-h6 {{ $t("dashboard.bank") }}
          br
          br
          v-card-title
            .text-overline.text-center.text-decoration-underline(@click="show_modal = true") {{ $t("dashboard.addBank") }}
          br
  v-dialog(v-model='show_modal' width='600')
    v-card
      v-form(@submit.prevent="handleSubmit")
        v-card-title.text-center {{ mutable_bank?.id ? $t("dashboard.editBank") : $t("dashboard.addBank") }}
        v-card-text.mt-4
          v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
          v-row(dense justify="center")
            v-col(cols="10")
              v-text-field(name='name' :label='$t("dashboard.name")' v-model='mutable_bank.name' :rules="[$v.required()]")
            v-col(cols="10")
              v-text-field(name='amount' :label='$t("dashboard.amount")' v-model.number='mutable_bank.amount' :rules="[$v.required(), $v.number()]")

        v-card-actions.mb-2
          v-row(dense justify="center")
            v-col.d-flex.justify-center(cols="12" lg="8")
              v-btn.bg-secondary.text-white(type="submit") {{ mutable_bank?.id ? $t("dashboard.editBank") : $t("dashboard.addBank") }}

</template>

<script setup lang="ts">
import type { Revenus, Costs } from "../../../types/models";

const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
const bankStore = useBankStore();
const { compute, filterAll } = useFilter(revenuStore, "revenus");
const { items } = compute;
const show_modal = ref(false);
let mutable_bank = ref({
  id: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  name: "",
  amount: 0,
});
let costChartData = ref(null);
let creditChartData = ref(null);
let lineChartData = ref(null);
const dates: string[] = [];
let revenu: Ref<(Revenus & { Costs: Costs }) | unknown> = ref(null);

onBeforeMount(async () => {
  await bankStore.getBanks();
  if (!revenuStore.revenus.length) {
    await filterAll("Revenus", true, {
      BankId: bankStore.$state.banks[0]?.id,
    });
    revenuStore.revenus.value = items.value;
  }
  if (bankStore.$state.banks.length) mutable_bank.value = bankStore.$state.banks[0];
  revenu.value = items.value[0];
  const today = new Date(revenu.value?.Costs?.at(0)?.createdAt);
  const month = today.getMonth();
  const year = today.getFullYear();

  for (let i = 2; i <= today.getDate() + 1; i++) {
    const date = new Date(year, month, i);
    const dateString = date.toLocaleDateString("fr-FR", { timeZone: "UTC" });
    dates.push(dateString);
  }

  costChartData.value = getCostChartData(revenu.value);
  creditChartData.value = getCreditChartData(revenu.value);
  lineChartData.value = getLineChartData(revenu.value);
});

function getCostChartData(revenuData) {
  const groupedCosts = revenuData?.Costs.reduce((groupedCosts, cost) => {
    const date = new Date(cost.createdAt).toLocaleDateString("fr-FR", { timeZone: "UTC" });
    if (!groupedCosts[date]) {
      groupedCosts[date] = [];
    }
    groupedCosts[date].push(cost);
    return groupedCosts;
  }, {});

  if (!groupedCosts) return;

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "",
        data: [] as string[],
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4"],
      },
    ],
  };

  if (groupedCosts) {
    for (let group of dates) {
      if (groupedCosts[group]) {
        chartData.datasets[0].data.push(groupedCosts[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2));
      } else {
        chartData.datasets[0].data.push("0");
      }
    }
  }

  return chartData;
}

function getCreditChartData(revenuData) {
  const groupedCredits = revenuData?.Credits.reduce((groupedCredits, credit) => {
    const date = new Date(credit.createdAt).toLocaleDateString("fr-FR", { timeZone: "UTC" });
    if (!groupedCredits[date]) {
      groupedCredits[date] = [];
    }
    groupedCredits[date].push(credit);
    return groupedCredits;
  }, {});

  if (!groupedCredits) return;

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "",
        data: [] as string[],
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4"],
      },
    ],
  };

  if (groupedCredits) {
    for (let group of dates) {
      if (groupedCredits[group]) {
        chartData.datasets[0].data.push(groupedCredits[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2));
      } else {
        chartData.datasets[0].data.push("0");
      }
    }
  }

  return chartData;
}

function getLineChartData(revenuData) {
  const groupedCredits = revenuData?.Credits.reduce((groupedCredits, credit) => {
    const date = new Date(credit.createdAt).toLocaleDateString("fr-FR", { timeZone: "UTC" });
    if (!groupedCredits[date]) {
      groupedCredits[date] = [];
    }
    groupedCredits[date].push(credit);
    return groupedCredits;
  }, {});

  const groupedCosts = revenuData?.Costs.reduce((groupedCosts, cost) => {
    const date = new Date(cost.createdAt).toLocaleDateString("fr-FR", { timeZone: "UTC" });
    if (!groupedCosts[date]) {
      groupedCosts[date] = [];
    }
    groupedCosts[date].push(cost);
    return groupedCosts;
  }, {});

  if (!groupedCredits && !groupedCosts) return;

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "Revenus",
        data: [],
        backgroundColor: "#05445E",
        fill: false,
        borderColor: "#05445E",
      },
      {
        label: "Costs",
        backgroundColor: "#75E6DA",
        data: [] as string[],
        fill: false,
        borderColor: "#75E6DA",
      },
    ],
  };

  if (groupedCredits) {
    let creditTotal = 0;
    for (let group of dates) {
      if (groupedCredits[group]) {
        creditTotal += +groupedCredits[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2);
        chartData.datasets[0].data.push(`${creditTotal}`);
      } else {
        chartData.datasets[0].data.push(`${creditTotal}`);
      }
    }
  }

  if (groupedCosts) {
    let costTotal = 0;
    for (let group of dates) {
      if (groupedCosts[group]) {
        costTotal += Math.abs(+groupedCosts[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2));
        chartData.datasets[1].data.push(`${costTotal}`);
      } else {
        chartData.datasets[1].data.push(`${costTotal}`);
      }
    }
  }

  return chartData;
}

const chartOptions = {
  responsive: true,
};

function revenuDate(revenu: Revenus) {
  const date = new Date(revenu?.createdAt);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

async function handleSubmit(): Promise<void> {
  indexStore.setLoading(true);
  let action = mutable_bank.value.id ? "updateBank" : "createBank";
  const bankRevenu = mutable_bank.value;
  delete bankRevenu["Revenus"];
  try {
    mutable_bank = await bankStore[action](bankRevenu);
    show_modal.value = false;
  } finally {
    indexStore.setLoading(false);
  }
}
</script>
