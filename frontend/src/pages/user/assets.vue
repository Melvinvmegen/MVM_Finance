<template lang="pug">
v-row
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") {{ $t("assets.title") }}
          v-spacer  
          v-col(cols="1" class="d-flex justify-center align-center")
            v-btn(icon="mdi-plus" color="primary" @click="show_modal = true")
            v-btn(icon="mdi-restore" color="primary" @click="refreshAssetsStats")

      v-card-text
        AssetTable(:items="items" :asset-types="asset_types" @filter="refreshAssets")
    .mt-4
  v-col(cols="12" md="4")
    v-card
      v-icon.mr-4.mt-4(@click="refreshUserStats") mdi-restore
      v-card-text(v-if="investment_profile")
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("investment-profile.average_revenu_perso") }}
          v-card-title {{ $n(investment_profile.average_revenu_perso, "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("investment-profile.average_revenu_pro") }}
          v-card-title {{ $n(investment_profile.average_revenu_pro, "currency") }}
        hr.mx-2.my-4
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("investment-profile.average_revenu_total") }}
          v-card-title {{ $n(investment_profile.average_revenu_total, "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("investment-profile.average_expense") }}
          v-card-title {{ $n(investment_profile.average_expense, "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("investment-profile.average_investments") }}
          v-card-title {{ $n(investment_profile.average_investments, "currency") }}
        hr.mx-2.my-4
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("investment-profile.average_balance") }}
          v-card-title {{ $n(investment_profile.average_balance, "currency") }}
    v-card.mt-4
      v-card-text
        v-card-title.text-center.mb-2 {{ $t("assets.total") }} : {{ $n(totalAssets, "currency") }}
        PieChart(v-if="chartData" :chart-data='chartData' :chart-options='chartOptions')
  
  AssetModal(v-if="show_modal" :model="{}" :show="show_modal" @close="show_modal = false" :asset-types="asset_types")
</template>

<script setup lang="ts">
import { setUsersStats, setAssetsStats } from "../../utils/generated/api-cron";
import { getInvestmentProfile, getAssets, getAssetTypes } from "../../utils/generated/api-user";
import type { investment_profile } from "../../../types/models";

const loadingStore = useLoadingStore();
const { filterAll, items } = useFilter(getAssets);
const investment_profile = ref<investment_profile>();
const show_modal = ref(false);
const asset_types = ref([]);

onMounted(async () => {
  loadingStore.setLoading(true);
  investment_profile.value = await getInvestmentProfile();
  asset_types.value = await getAssetTypes();
  loadingStore.setLoading(false);
});

async function refreshAssets(value) {
  loadingStore.setLoading(true);
  try {
    await filterAll({
      ...value,
      force: !!items.value.count,
    });
  } catch (err) {
    console.error(err);
  } finally {
    loadingStore.setLoading(false);
  }
}

async function refreshUserStats(value) {
  loadingStore.setLoading(true);
  try {
    await setUsersStats({
      investmentProfileIds: [investment_profile.value.id],
    });
  } catch (err) {
    console.error(err);
  } finally {
    loadingStore.setLoading(false);
  }
}

async function refreshAssetsStats(value) {
  loadingStore.setLoading(true);
  try {
    await setAssetsStats({
      assetIds: items.value.rows.map((r) => r.id),
    });
  } catch (err) {
    console.error(err);
  } finally {
    loadingStore.setLoading(false);
  }
}

const totalAssets = computed(() => {
  if (!items.value.count) return 0;
  const total = items.value.rows.reduce((sum: number, asset) => sum + asset.amount, 0);
  return Math.round(total);
});

const chartData = computed(() => {
  const chartData = {
    labels: items.value.rows.map((asset) => `${asset.asset_type.name} (${asset.name})`),
    datasets: [
      {
        label: "",
        data: [] as string[],
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20", "#FC2E20", "#FDB750"],
      },
    ],
  };
  for (let asset of items.value.rows) {
    const percentage = (asset.amount / totalAssets.value) * 100;
    chartData.datasets[0].data.push(percentage);
  }
  return chartData;
});

const chartOptions = {
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
</script>
