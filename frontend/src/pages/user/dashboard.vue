<template lang="pug">
v-alert(v-if="showUrssafAlert" @click="hideAlert('showUrssaf')" closable type="warning" class="my-2") {{ $t("dashboard.alert.urssaf") }}
v-alert(v-if="showVatAlert" @click="hideAlert('showVat')" closable type="warning" class="my-2") {{ $t("dashboard.alert.vat") }}
div
  v-row
    v-col(v-if="costChartData" cols="12" md="4")
      v-card(elevation="3")
        v-card-title
          v-col.text-uppercase(cols="11") {{ $t("dashboard.costs") }} ({{ revenuDate }})
        v-card-text
          BarChart(:chart-data='costChartData' :chart-options='chartOptions')
    v-col(v-if="creditChartData" cols="12" md="4")
      v-card(elevation="3")
        v-card-title
          v-col.text-uppercase(cols="11") {{ $t("dashboard.revenus") }} ({{ revenuDate }})
        v-card-text
          BarChart(:chart-data='creditChartData' :chart-options='chartOptions')
    v-col(cols="12" md="4")
      Weather

  v-row  
    v-col(v-if="lineChartData" cols="12" md="8")
      v-card(elevation="3")
        .d-flex.justify-space-between
          v-card-title
            v-col.text-uppercase(cols="11") {{ $t("dashboard.evolution") }} ({{ revenuDate }})
          v-icon.mr-4.mt-4(@click="resetAll") mdi-restore
        v-card-text
          LineChart(:chart-data='lineChartData' :chart-options='chartOptions')
    v-col(v-if="revenu" cols="12" md="4")
      v-card(class="v-col")
        v-card-text
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.revenuPro") }}
            v-card-title {{ $n(revenu?.pro, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.revenuPerso") }}
            v-card-title + {{ $n(revenu?.perso, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.refund") }}
            v-card-title + {{ $n(revenu?.refund, "currency") }}
          hr.mx-2.my-4
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("revenu.total") }}
            v-card-title {{ $n(revenu?.total, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.costs") }}
            v-card-title {{ $n(revenu?.expense, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.investments") }}
            v-card-title - {{ $n(revenu?.investments, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.tax_amount") }}
            v-card-title - {{ $n(revenu?.tax_amount, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.vatBalance") }}
            v-card-title - {{ $n(revenu?.tva_balance, "currency") }}
          hr.mx-2.my-4
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("dashboard.balance") }}
            v-card-title {{ $n(revenu.balance, "currency") }}

    v-card(v-else-if="!revenu && ready" class="v-col")
      v-card-title.text-center {{ $t("dashboard.noRevenuTitle") }}
      v-card-text.text-center 
        p {{ $t("dashboard.noRevenuText") }}
        br
        v-btn.bg-secondary.text-white(type="submit" to="/revenus") {{ $t("dashboard.createRevenu") }}

</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { getRevenus } from "../../utils/generated/api-user";
import type { revenu, cost, credit } from "../../../types/models";

const loadingStore = useLoadingStore();
const ready = ref(false);
const { filterAll, items } = useFilter(getRevenus);
const dates: string[] = [];
let revenu: Ref<(revenu & { costs: cost[]; credits: credit[] }) | null> = ref(null);
const chartOptions = {
  responsive: true,
};
const revenuDate = computed(() => {
  if (!revenu.value) return;
  return dayjs(revenu.value.created_at).format("MMMM YYYY");
});

onMounted(async () => {
  await filterAll({
    perPage: 1,
  });

  revenu.value = items.value.rows[0];
  const today = dayjs(revenu?.value?.costs?.at(0)?.created_at);

  for (let i = 2; i <= today.date() + 1; i++) {
    const date = dayjs().year(today.year()).month(today.month()).date(i).format("L");
    dates.push(date);
  }
  ready.value = true;
});

const costChartData = computed(() => {
  const grouped_costs = revenu.value?.costs.reduce((grouped_costs, cost) => {
    const date = dayjs(cost.created_at).format("L");
    if (!grouped_costs[date]) {
      grouped_costs[date] = [];
    }
    grouped_costs[date].push(cost);
    return grouped_costs;
  }, {});

  if (!grouped_costs) return;

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

  if (grouped_costs) {
    for (let group of dates) {
      if (grouped_costs[group]) {
        chartData.datasets[0].data.push(grouped_costs[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2));
      } else {
        chartData.datasets[0].data.push("0");
      }
    }
  }

  return chartData;
});

const creditChartData = computed(() => {
  const grouped_credits = revenu.value?.credits.reduce((grouped_credits, credit) => {
    const date = dayjs(credit.created_at).format("L");
    if (!grouped_credits[date]) {
      grouped_credits[date] = [];
    }
    grouped_credits[date].push(credit);
    return grouped_credits;
  }, {});

  if (!grouped_credits) return;

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

  if (grouped_credits) {
    for (let group of dates) {
      if (grouped_credits[group]) {
        chartData.datasets[0].data.push(grouped_credits[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2));
      } else {
        chartData.datasets[0].data.push("0");
      }
    }
  }

  return chartData;
});

const lineChartData = computed(() => {
  const grouped_credits = revenu.value?.credits.reduce((grouped_credits, credit) => {
    const date = dayjs(credit.created_at).format("L");
    if (!grouped_credits[date]) {
      grouped_credits[date] = [];
    }
    grouped_credits[date].push(credit);
    return grouped_credits;
  }, {});

  const grouped_costs = revenu.value?.costs.reduce((grouped_costs, cost) => {
    const date = dayjs(cost.created_at).format("L");
    if (!grouped_costs[date]) {
      grouped_costs[date] = [];
    }
    grouped_costs[date].push(cost);
    return grouped_costs;
  }, {});

  if (!grouped_credits && !grouped_costs) return;

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

  if (grouped_credits) {
    let creditTotal = 0;
    for (let group of dates) {
      if (grouped_credits[group]) {
        creditTotal += +grouped_credits[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2);
        chartData.datasets[0].data.push(`${creditTotal}`);
      } else {
        chartData.datasets[0].data.push(`${creditTotal}`);
      }
    }
  }

  if (grouped_costs) {
    let costTotal = 0;
    for (let group of dates) {
      if (grouped_costs[group]) {
        costTotal += Math.abs(+grouped_costs[group].reduce((sum, cost) => sum + cost.total, 0).toFixed(2));
        chartData.datasets[1].data.push(`${costTotal}`);
      } else {
        chartData.datasets[1].data.push(`${costTotal}`);
      }
    }
  }

  return chartData;
});

async function resetAll(): Promise<void> {
  loadingStore.setLoading(true);
  try {
    await filterAll({
      perPage: 1,
      force: true,
    });
  } catch (err) {
    console.error(err);
  } finally {
    loadingStore.setLoading(false);
  }
}

const showUrssafAlert = computed(() => {
  const showUrssaf = document.cookie.includes("showUrssaf");

  if (!showUrssaf) {
    document.cookie = "showUrssaf=true; max-age=2592000; path=/;";
  }

  return JSON.parse(getCookie("showUrssaf") || "");
});

const showVatAlert = computed(() => {
  let showVat = document.cookie.includes("showVat");

  if (!showVat) {
    document.cookie = "showVat=true; max-age=2592000; path=/;";
  }

  return JSON.parse(getCookie("showVat") || "");
});

function getCookie(cookieName) {
  const cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(cookieName + "=")) {
      return cookie.substring(cookieName.length + 1);
    }
  }

  return null;
}

function hideAlert(cookieName) {
  document.cookie = `${cookieName}=false; max-age=2592000; path=/;`;
}
</script>
