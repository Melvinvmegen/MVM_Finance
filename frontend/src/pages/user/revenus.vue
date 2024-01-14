<template lang="pug">
v-row(v-if="items.rows")
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title.text-h5
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") {{ $t("revenus.title") }}
          v-spacer
          v-col(cols="1")
            v-btn(icon="mdi-plus" @click="showModal = true;" color="primary")
      v-card-text
        RevenuTable(:items="items" @filter="refreshRevenus")

    v-dialog(v-model='showModal' width='600')
      v-card(width="100%")
        v-form(@submit.prevent="uploadFile")
          v-card-title.text-center {{ $t("revenus.import") }}
          v-card-text.mt-4
            v-row(dense justify="center")
              v-col(cols="10")
                v-select(:items="banks" :item-props="itemProps" v-model="mutableImport.BankId" :label='$t("revenus.banks")')
              v-col(cols="10")
                v-file-input(clearable :label="$t('revenus.fileInput')" accept=".csv" v-model="mutableImport.file")
          v-card-actions.mb-2
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn.bg-secondary.text-white(type="submit") {{ $t("revenus.import") }}
    v-row
      v-col(cols="12" md="6")
        v-card(elevation="3" class="mt-4")
          v-card-text
            v-row(justify="space-around" align="center")
                v-row.my-2(justify="space-between" align="center")   
                  template(v-if="expensesAverage")
                    v-card-subtitle.pl-10 {{ $t("revenus.averageMonthlySpending") }}
                    v-card-title.pr-10 {{ $n(expensesAverage, "currency") }}
                  template(v-if="recurrentCosts")
                    .text-caption.text-disabled.pl-10 {{ $t("revenus.averageRecurrentSpending") }}
                    v-card-subtitle.pr-10 {{ $n(recurrentCosts, "currency") }}
                BarChart(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
      v-col(cols="12" md="6")
        v-card(elevation="3" class="mt-4")
          v-card-text
            v-row(justify="space-around" align="center")
                v-row.my-2(justify="space-between" align="center")
                  template(v-if="revenusAverage")
                    v-card-subtitle.pl-10 {{ $t("revenus.averageRevenu") }}
                    v-card-title.pr-10 {{ $n(revenusAverage, "currency") }}
                  template(v-if="recurrentCredits")
                    .text-caption.text-disabled.pl-10 {{ $t("revenus.averageRecurrentCredits") }}
                    v-card-subtitle.pr-10 {{ $n(recurrentCredits, "currency") }}
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

    v-card.mt-4
      v-card-text
        v-row(justify="center" align="center")
          v-col(cols="12" md="10")
            v-row(justify="space-around" align="center")
              v-card-title {{ $t("revenus.costDistribution") }}
            br
            PieChart(v-if="costPieChartData" :chart-data='costPieChartData' :chart-options='pieChartOptions')

    v-card.mt-4
      v-card-text
        v-row(justify="center" align="center")
          v-col(cols="12" md="10")
            v-row(justify="space-around" align="center")
              v-card-title {{ $t("revenus.revenuDistribution") }}
            br
            PieChart(v-if="creditPieChartData" :chart-data='creditPieChartData' :chart-options='pieChartOptions')

</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { getBanks, getRevenus, createRevenu, getCategories } from "../../utils/generated/api-user";
import type { Banks, cost_category, credit_category } from "../../../types/models";

const loadingStore = useLoadingStore();
const banks = ref<Banks[]>([]);
const { filterAll, items } = useFilter(getRevenus);
const showModal = ref(false);
const mutableImport = ref();
const costCategories = ref<cost_category[]>([]);
const creditCategories = ref<credit_category[]>([]);

onMounted(async () => {
  banks.value = await getBanks();
  mutableImport.value = {
    BankId: banks.value[0].id,
    file: null,
  };
  await filterAll();
  const { cost_categories, credit_categories } = await getCategories();
  costCategories.value = cost_categories;
  creditCategories.value = credit_categories;
});

async function refreshRevenus(value) {
  loadingStore.setLoading(true);
  await filterAll({
    ...value,
    force: !!items.value.count,
  });
  loadingStore.setLoading(false);
}

const costPieChartData = computed(() => {
  if (!items.value.count) return;
  const costs = items.value.rows.flatMap((revenu) => revenu.Costs);
  const groupedModel = costs.reduce((acc, item) => {
    if (!acc[item.CostCategoryId]) {
      acc[item.CostCategoryId] = {
        CostCategoryId: item.CostCategoryId,
        costs: [],
      };
    }

    acc[item.CostCategoryId].costs.push(item);
    return acc;
  }, {});

  const modelTotalByCategory = costCategories.value.map((category) => {
    if (groupedModel[category.id]) {
      return groupedModel[category.id].costs.reduce((sum, model) => sum + model.total, 0);
    } else {
      return 0;
    }
  });

  const total = modelTotalByCategory.reduce((sum, model) => sum + model, 0);

  return {
    labels: costCategories.value.map((i) => i.name),
    datasets: [
      {
        data: modelTotalByCategory.map((model) => Math.round((model / total) * 100)),
        backgroundColor: costCategories.value.map((i) => i.color),
      },
    ],
  };
});

const creditPieChartData = computed(() => {
  if (!items.value.count) return;
  const credits = items.value.rows.flatMap((revenu) => revenu.Credits);
  const groupedModel = credits.reduce((acc, item) => {
    if (!acc[item.CreditCategoryId]) {
      acc[item.CreditCategoryId] = {
        CreditCategoryId: item.CreditCategoryId,
        credits: [],
      };
    }

    acc[item.CreditCategoryId].credits.push(item);
    return acc;
  }, {});

  const modelTotalByCategory = creditCategories.value.map((category) => {
    if (groupedModel[category.id]) {
      return groupedModel[category.id].credits.reduce((sum, model) => sum + model.total, 0);
    } else {
      return 0;
    }
  });

  const total = modelTotalByCategory.reduce((sum, model) => sum + model, 0);

  return {
    labels: creditCategories.value.map((i) => i.name),
    datasets: [
      {
        data: modelTotalByCategory.map((model) => Math.round((model / total) * 100)),
        backgroundColor: creditCategories.value.map((i) => i.color),
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

async function uploadFile() {
  if (!banks.value.length) return;
  loadingStore.setLoading(true);
  try {
    await createRevenu(mutableImport.value.BankId, { file: mutableImport.value.file });
    await refreshRevenus({});
    showModal.value = false;
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
  const total = items.value.rows.reduce((sum, revenu) => sum + revenu.expense, 0);
  return Math.round(total);
});

const taxAmount = computed(() => {
  if (!items.value.count) return 0;
  const total_tax_amount = items.value.rows.reduce((sum: number, revenu) => sum - revenu.tax_amount, 0);
  return Math.round(total_tax_amount);
});

const expensesAverage = computed(() => {
  if (!items.value.count) return 0;
  const total_expense = items.value.rows.reduce((sum: number, revenu) => sum - revenu.expense, 0);
  return Math.round(total_expense / items.value.rows.length);
});

const revenusAverage = computed(() => {
  if (!items.value.count) return 0;
  const total_revenu = items.value.rows.reduce((sum: number, revenu) => sum + revenu.total, 0);
  return Math.round(total_revenu / items.value.rows.length);
});

const recurrentCosts = computed(() => {
  if (!items.value.count) return 0;
  const total_reccurent_costs = items.value.rows.reduce((sum: number, revenu) => sum + revenu.recurrent_costs, 0);
  return Math.round(total_reccurent_costs / items.value.rows.length);
});

const recurrentCredits = computed(() => {
  if (!items.value.count) return 0;
  const total_reccurent_credits = items.value.rows.reduce((sum: number, revenu) => sum + revenu.recurrent_credits, 0);
  return Math.round(total_reccurent_credits / items.value.rows.length);
});

function itemProps(item) {
  return {
    title: item.name,
    value: item.id,
  };
}
</script>
