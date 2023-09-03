<template lang="pug">
v-row(v-if="items.rows")
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") {{ $t("revenus.title") }}
          v-spacer
          v-col(cols="1")
            v-btn(icon="mdi-plus" @click="triggerUpload" color="primary")
            input.mr-2(type="file" id="fileInput" name="fileInput" accept=".csv" style="display:none;" @change="uploadFile")

      v-card-text
        RevenuTable(:items="items" @filter="refreshRevenus")
    v-card(elevation="3" class="mt-4")
      v-card-text
        v-row(justify="space-around" align="center")
          v-col(cols="12" md="6")
            v-row(justify="space-around" align="center")   
              v-col(v-if="expensesAverage" cols="12" md="6")
                v-card-subtitle {{ $t("revenus.averageMonthlySpending") }}
                v-card-title {{ $n(expensesAverage, "currency") }}
              v-col(v-if="recurrentCosts" cols="12" md="6")
                v-card-subtitle {{ $t("revenus.averageRecurrentSpending") }}
                v-card-title {{ $n(recurrentCosts, "currency") }}
            BarChart(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
          v-col(cols="12" md="6")
            v-row(v-if="revenusAverage" justify="space-around" align="start")
              v-card-subtitle {{ $t("revenus.averageRevenu") }}
              v-card-title.pt-0.mb-4 {{ $n(revenusAverage, "currency") }}
            BarChart(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')

  v-col(cols="12" md="4")
    v-card
      v-card-text(v-if="items.rows")
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.turnover") }}
          v-card-title {{ $n(revenusTotal, "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.totalSpending") }}
          v-card-title {{ $n(revenusCostTotal, "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.taxes") }}
          v-card-title {{ $n(- taxAmount, "currency") }}
        hr.mx-2.my-4
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.netResult") }}
          v-card-title {{ $n(Math.round(revenusTotal + revenusCostTotal), "currency") }}
      hr.mx-2.my-4
      v-card-text
        v-row(justify="center" align="center")
          v-col(cols="12" md="10")
            v-row(justify="space-around" align="center")
              v-card-subtitle {{ $t("revenus.costDistribution") }}
            br
            PieChart(v-if="costPieChartData" :chart-data='costPieChartData' :chart-options='pieChartOptions')
            hr.mx-2.my-10
            v-row(justify="space-around" align="center")
              v-card-subtitle {{ $t("revenus.revenuDistribution") }}
            br
            PieChart(v-if="creditPieChartData" :chart-data='creditPieChartData' :chart-options='pieChartOptions')

</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { getBanks, getRevenus, createRevenu } from "../../utils/generated/api-user";
import type { Banks } from "../../../types/models";
const loadingStore = useLoadingStore();
const banks = ref<Banks[]>([]);
const { filterAll, items } = useFilter(getRevenus);

onMounted(async () => {
  banks.value = await getBanks();
  await filterAll();
});

async function refreshRevenus(value) {
  await filterAll(value);
}

const costPieChartData = computed(() => {
  if (!items.value.count) return;
  const costCategories = [
    "GENERAL",
    "TAX",
    "INTERESTS",
    "TRIP",
    "HEALTH",
    "SERVICES",
    "HOUSING",
    "INVESTMENT",
    "TODEFINE",
  ];
  const costs = items.value.rows.flatMap((revenu) => revenu.Costs);
  const groupedModel = costs.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        category: item.category,
        costs: [],
      };
    }

    acc[item.category].costs.push(item);
    return acc;
  }, {});

  const modelTotalByCategory = costCategories.map((category) => {
    if (groupedModel[category]) {
      return groupedModel[category].costs.reduce((sum, model) => sum + model.total, 0);
    } else {
      return 0;
    }
  });

  const total = modelTotalByCategory.reduce((sum, model) => sum + model, 0);

  return {
    labels: costCategories,
    datasets: [
      {
        data: modelTotalByCategory.map((model) => Math.round((model / total) * 100)),
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20", "#FC2E20", "#FDB750", "#010100"],
      },
    ],
  };
});

const creditPieChartData = computed(() => {
  if (!items.value.count) return;
  const creditCategories = ["SALARY", "REFUND", "CRYPTO", "STOCK", "RENTAL", "TRANSFER"];
  const credits = items.value.rows.flatMap((revenu) => revenu.Credits);
  const groupedModel = credits.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        category: item.category,
        credits: [],
      };
    }

    acc[item.category].credits.push(item);
    return acc;
  }, {});

  const modelTotalByCategory = creditCategories.map((category) => {
    if (groupedModel[category]) {
      return groupedModel[category].credits.reduce((sum, model) => sum + model.total, 0);
    } else {
      return 0;
    }
  });

  const total = modelTotalByCategory.reduce((sum, model) => sum + model, 0);

  return {
    labels: creditCategories,
    datasets: [
      {
        data: modelTotalByCategory.map((model) => Math.round((model / total) * 100)),
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20", "#FC2E20", "#FDB750", "#010100"],
      },
    ],
  };
});

const pieChartOptions = {
  responsive: true,
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let tooltipData = context.dataset.data[context.dataIndex];
          return ` ${tooltipData}%`;
        },
      },
    },
  },
};

const costChartData = computed(() => {
  if (!items.value.count) return;
  const reversed_revenus = items.value.rows.slice().reverse();
  const chartData = {
    labels: reversed_revenus.map((revenu) => {
      return dayjs(revenu.createdAt).format("MMMM YYYY");
    }),
    datasets: [
      {
        label: "",
        data: [] as string[],
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
  if (!items.value.count) return;
  const reversed_revenus = items.value.rows.slice().reverse();
  const chartData = {
    labels: reversed_revenus.map((revenu) => {
      return dayjs(revenu.createdAt).format("MMMM YYYY");
    }),
    datasets: [
      {
        label: "",
        data: [] as string[],
        backgroundColor: ["#FD7F20", "#FC2E20", "#FDB750", "#010100"],
      },
    ],
  };
  chartData.datasets[0].data.push;
  for (let revenu of reversed_revenus) {
    chartData.datasets[0].data.push(`${revenu.total}`);
  }
  return chartData;
});
const chartOptions = {
  responsive: true,
};

function triggerUpload() {
  document.getElementById("fileInput")?.click();
}

async function uploadFile(event) {
  if (!banks.value.length) return;
  loadingStore.setLoading(true);
  try {
    await createRevenu(banks.value?.[0].id, { file: event.target.files[0] });
  } finally {
    loadingStore.setLoading(false);
  }
}

const revenusTotal = computed(() => {
  if (!items.value.count) return 0;
  const totals = items.value.rows.reduce((sum: number, revenu) => sum + revenu.total, 0);
  return Math.round(totals);
});

const revenusCostTotal = computed(() => {
  if (!items.value.count) return 0;
  let total = 0;
  for (let revenu of items.value.rows) {
    if (revenu.Costs) {
      total += revenu.Costs.reduce((sum, cost) => sum + cost.total, 0);
    }
  }
  return Math.round(total);
});

const taxAmount = computed(() => {
  // Abattement de 30% avant impots sur le CA
  const taxable_income = revenusTotal.value / 1.3;
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
});

const expensesAverage = computed(() => {
  // TODO: exclude internal transfer
  if (!items.value.count) return 0;
  const total_expense = items.value.rows.reduce((sum: number, revenu) => sum - revenu.expense, 0);
  return Math.round(total_expense / items.value.rows.length);
});

const revenusAverage = computed(() => {
  // TODO: exclude internal transfer
  if (!items.value.count) return 0;
  const total_revenu = items.value.rows.reduce((sum: number, revenu) => sum + revenu.total, 0);
  return Math.round(total_revenu / items.value.rows.length);
});

const recurrentCosts = computed(() => {
  if (!items.value.count) return 0;
  return items.value.rows[0]?.Costs?.filter((c) => c.recurrent).reduce((sum, cost) => sum + cost.total, 0) || 0;
});
</script>
