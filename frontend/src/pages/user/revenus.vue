<template lang="pug">
v-row(v-if="items.rows")
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title.text-h5
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") {{ $t("revenus.title") }}
          v-spacer
          v-col(cols="1")
            v-btn(icon="mdi-plus" @click="show_modal = true;" color="primary")
      v-card-text
        RevenuTable(:items="items" @filter="refreshRevenus")

    v-dialog(v-model='show_modal' width='600')
      v-card(width="100%")
        v-stepper.hide-stepper-header(v-model="step" :items="['upload', 'report']" hide-actions flat)
          template(#item.1)
            v-form(@submit.prevent="uploadFile")
              v-card-title.text-center {{ $t("revenus.import") }}
              v-card-text.mt-4
                v-row(dense justify="center")
                  v-col(cols="10")
                    v-select(:items="assets" :item-props="itemProps" v-model="mutableImport.asset_id" :label='$t("revenus.assets")')
                  v-col(cols="10")
                    v-file-input(clearable :label="$t('revenus.fileInput')" accept=".csv" v-model="mutableImport.file" :rules="[$v.required()]")
                  v-col(cols="10")
                    a.text-body-2.mb-2.text-decoration-underline(href="javascript:void(0)" @click="downloadImportSample") {{ $t("revenus.import_sample") }}
              v-card-actions.mb-2
                v-row(dense justify="center")
                  v-col.d-flex.justify-center(cols="12" lg="8")
                    v-btn(@click="show_modal = false") {{ $t("dashboard.cancel") }}
                    v-btn.bg-secondary.text-white(type="submit") {{ $t("revenus.import") }}
          template(#item.2)
            div.d-flex.flex-column.justify-center.align-center
              v-icon(class="text-center" color="success" large) mdi-check-circle-outline
              div(v-for="(report, index) in reports" :key="index")
                div(v-if="report?.inserted || report?.updated" class="d-flex justify-center flex-column align-center")
                  v-card-title {{ $t("revenus.import_successful", [report.date]) }}
                  v-card-text
                    p(v-if="report?.rows") {{ $t("revenus.rows", [report?.rows]) }}
                    p(v-if="report?.inserted") {{ $t("revenus.inserted", [report?.inserted]) }}
                    p(v-if="report?.updated") {{ $t("revenus.updated", [report?.updated]) }}
                hr.my-2(v-if="(report?.inserted || report?.updated) && report?.failed?.length")
                div(v-if="report?.failed?.length" class="d-flex justify-center flex-column align-center")
                  v-icon(color="error" large) mdi-alert-outline
                  v-card-title {{ $t("revenus.import_failed", [report?.failed.length, (report?.rows || 0)]) }}
                  v-card-text
                    a.text-body-2.mb-2.text-decoration-underline(href="javascript:void(0)" @click="downloadImportSample" class="text-body-1") {{ $t("revenus.import_failed_report") }}
            v-card-actions
              v-row(dense justify="center")   
                v-col.d-flex.justify-center(cols="12" lg="8")
                  v-btn(@click="show_modal = false") {{ $t("revenus.cancel") }}
                  v-btn(@click="resetImport") {{ $t("revenus.reset") }}

    v-row
      v-col(cols="12" md="6")
        v-card(elevation="3" class="mt-4")
          v-card-text
            v-row(justify="space-around" align="center")
                v-row.my-2(justify="space-between" align="center")   
                  template(v-if="expensesAverage")
                    v-card-subtitle.pl-10 {{ $t("revenus.averageMonthlySpending") }}
                    v-card-title.pr-10 {{ $n(expensesAverage, "currency") }}
                  template(v-if="recurrent_costs")
                    .text-caption.text-disabled.pl-10 {{ $t("revenus.averageRecurrentSpending") }}
                    v-card-subtitle.pr-10 {{ $n(recurrent_costs, "currency") }}
                BarChart(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
      v-col(cols="12" md="6")
        v-card(elevation="3" class="mt-4")
          v-card-text
            v-row(justify="space-around" align="center")
                v-row.my-2(justify="space-between" align="center")
                  template(v-if="revenusAverage")
                    v-card-subtitle.pl-10 {{ $t("revenus.averageRevenu") }}
                    v-card-title.pr-10 {{ $n(revenusAverage, "currency") }}
                  template(v-if="recurrent_credits")
                    .text-caption.text-disabled.pl-10 {{ $t("revenus.averageRecurrentCredits") }}
                    v-card-subtitle.pr-10 {{ $n(recurrent_credits, "currency") }}
                BarChart(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')

  v-col(cols="12" md="4")
    v-card
      v-card-text(v-if="items.rows")
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.turnover") }}
          v-card-title {{ $n(revenusTotal, "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.totalSpending") }}
          v-card-title {{ $n(revenus_cost_total, "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.taxes") }}
          v-card-title {{ $n(- taxAmount, "currency") }}
        hr.mx-2.my-4
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("revenus.netResult") }}
          v-card-title {{ $n(Math.round(revenusTotal + revenus_cost_total), "currency") }}

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
import {
  getAssets,
  getRevenus,
  createRevenu,
  getCategories,
  downloadSample,
  getRevenuReport,
} from "../../utils/generated/api-user";
import type { asset, cost_category, credit_category } from "../../../types/models";

const loadingStore = useLoadingStore();
const assets = ref<asset[]>([]);
const { filterAll, items } = useFilter(getRevenus);
const show_modal = ref(false);
const mutableImport = ref();
const costCategories = ref<cost_category[]>([]);
const creditCategories = ref<credit_category[]>([]);

onMounted(async () => {
  const assetValues = await getAssets({ perPage: 1000, force: true });
  assets.value = assetValues.rows;
  mutableImport.value = {
    asset_id: assets.value[0]?.id,
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
  const costs = items.value.rows.flatMap((revenu) => revenu.costs);
  const groupedModel = costs.reduce((acc, item) => {
    if (!acc[item.cost_category_id]) {
      acc[item.cost_category_id] = {
        cost_category_id: item.cost_category_id,
        costs: [],
      };
    }

    acc[item.cost_category_id].costs.push(item);
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
  const credits = items.value.rows.flatMap((revenu) => revenu.credits);
  const groupedModel = credits.reduce((acc, item) => {
    if (!acc[item.credit_category_id]) {
      acc[item.credit_category_id] = {
        credit_category_id: item.credit_category_id,
        credits: [],
      };
    }

    acc[item.credit_category_id].credits.push(item);
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
      return dayjs(revenu.created_at).format("MMMM YYYY");
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
      return dayjs(revenu.created_at).format("MMMM YYYY");
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
  if (!assets.value.length) return;
  loadingStore.setLoading(true);
  try {
    await createRevenu(mutableImport.value.asset_id, { file: mutableImport.value.file });
    reports.value = await getRevenuReport();
    await refreshRevenus({});
    step.value++;
  } finally {
    loadingStore.setLoading(false);
  }
}

const revenusTotal = computed(() => {
  if (!items.value.count) return 0;
  const totals = items.value.rows.reduce((sum: number, revenu) => sum + revenu.total, 0);
  return Math.round(totals);
});

const revenus_cost_total = computed(() => {
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

const recurrent_costs = computed(() => {
  if (!items.value.count) return 0;
  const total_reccurent_costs = items.value.rows.reduce((sum: number, revenu) => sum + revenu.recurrent_costs, 0);
  return Math.round(total_reccurent_costs / items.value.rows.length);
});

const recurrent_credits = computed(() => {
  if (!items.value.count) return 0;
  const total_reccurent_credits = items.value.rows.reduce((sum: number, revenu) => sum + revenu.recurrent_credits, 0);
  return Math.round(total_reccurent_credits / items.value.rows.length);
});

function itemProps(item) {
  return {
    title: `${item.name} (${item.asset_type.name})`,
    value: item.id,
  };
}

const reports = ref();
const step = ref(1);
function resetImport() {
  reports.value = [];
  step.value = 1;
  mutableImport.value = {
    model_kind_id: null,
    file: null,
  };
}

async function downloadImportSample() {
  loadingStore.setLoading(true);
  try {
    const response = await downloadSample({ entries: reports.value?.map((r) => r.failed) });
    if (response && !reports.value) {
      reports.value = response;
    }
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
<style>
.hide-stepper-header .v-stepper-header {
  display: none;
}
</style>
