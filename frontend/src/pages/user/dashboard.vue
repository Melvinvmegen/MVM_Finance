<template lang="pug">
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
        v-card-title
          v-col.text-uppercase(cols="11") {{ $t("dashboard.evolution") }} ({{ revenuDate }})
        v-card-text
          LineChart(:chart-data='lineChartData' :chart-options='chartOptions')
    v-col(v-if="revenu" cols="12" md="4")
      v-card(class="v-col")
        v-card-text
          template(v-if="revenu.pro || revenu.perso")
            v-row(justify="space-around" align="center" v-if="revenu?.pro")
              v-card-subtitle {{ $t("dashboard.revenuPro") }}
              v-card-title {{ $n(revenu?.pro, "currency") }}
            v-row(justify="space-around" align="center" v-if="revenu?.perso")
              v-card-subtitle {{ $t("dashboard.revenuPerso") }}
              v-card-title + {{ $n(revenu?.perso, "currency") }}
          template(v-else)
            v-row(justify="space-around" align="center" v-if="revenu?.total")
              v-card-subtitle {{ $t("revenu.total") }}
              v-card-title {{ $n(revenu?.total, "currency") }}
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
          v-row(justify="space-around" align="center" v-if="revenuBalance")
            v-card-subtitle {{ $t("dashboard.balance") }}
            v-card-title {{ $n(revenuBalance, "currency") }}

      v-carousel(v-if="revenuBalance && banks.length"      
        :continuous="!!banks.length"
        :show-arrows="banks.length > 1"
        hide-delimiters
        height="auto")
        template(v-slot:prev="{ props }")
          v-btn(
            icon="mdi-arrow-left" variant="plain" size="small"
            @click="props.onClick")
        template(v-slot:next="{ props }")
          v-btn(
            icon="mdi-arrow-right" variant="plain" size="small"
            @click="props.onClick")

        v-carousel-item(v-for="bank in banks" :key="bank.id")
          v-card(class="v-col mt-4")
            v-card-text
              v-card-subtitle.text-h6 {{ bank.name }}
              br
              v-card-title
                .d-flex.justify-center.align-center
                  .text-h4.mr-2 {{ $n(bank.amount + returnBalance(bank), "currency") }}
                  div(v-if="returnBalance(bank)")
                    v-icon(:class="[(returnBalance(bank)) > 0 ? 'text-success' : 'text-red']") mdi-chart-line-variant 
                    .text-subtitle-1.mr-2 {{ +(((returnBalance(bank)) / Math.max(bank.amount, 1)) * 100).toFixed(2) }}%
              br
              .d-flex.justify-space-between
                span.text-left
                  a.text-overline.text-decoration-underline(@click.prevent="showModalBank = true; mutableBank = {}") {{ $t("dashboard.addBank") }}
                span.text-right
                  a.text-overline.text-decoration-underline(@click.prevent="showModalBank = true; mutableBank = bank") {{ $t("dashboard.editBank") }}
            v-card-text(v-if="!banks.length")
              v-card-subtitle.text-h6 {{ $t("dashboard.bank") }}
              br
              br
              v-card-title
                .text-overline.text-center.text-decoration-underline(@click="showModalBank = true") {{ $t("dashboard.addBank") }}
              br

      v-carousel(v-if="revenuBalance && cashPots.length"      
        :continuous="!!cashPots.length"
        :show-arrows="cashPots.length > 1"
        hide-delimiters
        height="auto")
        template(v-slot:prev="{ props }")
          v-btn(
            icon="mdi-arrow-left" variant="plain" size="small"
            @click="props.onClick")
        template(v-slot:next="{ props }")
          v-btn(
            icon="mdi-arrow-right" variant="plain" size="small"
            @click="props.onClick")

        v-carousel-item(v-for="cashPot in cashPots" :key="cashPot.id")
          v-card(class="v-col mt-4" v-if="revenuBalance")
            v-card-text
              v-card-subtitle.text-h6 {{ cashPot.name }}
              br
              v-card-title
                .d-flex.justify-center.align-center
                  .text-h4.mr-2 {{ $n(cashPot.amount + returnBalance(cashPot), "currency") }}
                  div(v-if="returnBalance(cashPot)")
                    v-icon(:class="[(returnBalance(cashPot)) > 0 ? 'text-success' : 'text-red']") mdi-chart-line-variant 
                    .text-subtitle-1.mr-2 {{ +(((returnBalance(cashPot)) / Math.max(cashPot.amount, 1)) * 100).toFixed(2) }}%
              br
              .d-flex.justify-space-between
                span.text-left
                  a.text-overline.text-decoration-underline(@click.prevent="showModalCashPot = true; mutableCashPot = {}") {{ $t("dashboard.addCashPot") }}
                span.text-right
                  a.text-overline.text-decoration-underline(@click.prevent="showModalCashPot = true; mutableCashPot = cashPot") {{ $t("dashboard.editCashPot") }}

            v-card-text(v-if="!cashPots.length")
              v-card-subtitle.text-h6 {{ $t("dashboard.cashPot") }}
              br
              br
              v-card-title
                a.text-overline.text-center.text-decoration-underline(@click.prevent="showModalCashPot = true") {{ $t("dashboard.addCashPot") }}
              br

    v-card(v-else-if="!revenu && ready" class="v-col")
      v-card-title.text-center {{ $t("dashboard.noRevenuTitle") }}
      v-card-text.text-center 
        p {{ $t("dashboard.noRevenuText") }}
        br
        v-btn.bg-secondary.text-white(type="submit" to="/revenus") {{ $t("dashboard.createRevenu") }}

  v-dialog(v-model='showModalBank' width='600')
    v-card(width="100%")
      v-form(v-model="valid" @submit.prevent="handleBankSubmit")
        v-card-title.text-center {{ mutableBank?.id ? $t("dashboard.editBank") : $t("dashboard.addBank") }}
        v-card-text.mt-4
          v-row(dense justify="center")
            v-col(cols="10")
              v-text-field(name='name' :label='$t("dashboard.name")' v-model='mutableBank.name' :rules="[$v.required()]")
            v-col(cols="10")
              NumberInput(name='amount' :label='$t("dashboard.amount")' v-model='mutableBank.amount' :rules="[$v.required(),$v.number()]")
            v-col(cols="10")
              DateInput(v-model='mutableBank.amountDate' :label='$t("dashboard.amountDate")' :rules="[$v.required()]")

        v-card-actions.mb-2
          v-row(dense justify="center")
            v-col.d-flex.justify-center(cols="12" lg="8")
              v-btn.bg-secondary.text-white(type="submit") {{ mutableBank?.id ? $t("dashboard.editBank") : $t("dashboard.addBank") }}

  v-dialog(v-model='showModalCashPot' width='600')
    v-card(width="100%")
      v-form(v-model="valid" @submit.prevent="handleCashPotSubmit")
        v-card-title.text-center {{ mutableCashPot?.id ? $t("dashboard.editCashPot") : $t("dashboard.addCashPot") }}
        v-card-text.mt-4
          v-row(dense justify="center")
            v-col(cols="10")
              v-text-field(name='name' :label='$t("dashboard.name")' v-model='mutableCashPot.name' :rules="[$v.required()]")
            v-col(cols="10")
              NumberInput(name='amount' :label='$t("dashboard.amount")' v-model='mutableCashPot.amount' :rules="[$v.required(), $v.number()]")
            v-col(cols="10")
              DateInput(v-model='mutableCashPot.amountDate' :label='$t("dashboard.amountDate")' :rules="[$v.required()]")

        v-card-actions.mb-2
          v-row(dense justify="center")
            v-col.d-flex.justify-center(cols="12" lg="8")
              v-btn.bg-secondary.text-white(type="submit") {{ mutableCashPot?.id ? $t("dashboard.editCashPot") : $t("dashboard.addCashPot") }}

</template>

<script setup lang="ts">
import dayjs from "dayjs";
import {
  getBanks,
  createBank,
  updateBank,
  getRevenus,
  getCashPots,
  createCashPot,
  updateCashPot,
} from "../../utils/generated/api-user";
import type { Revenus, Costs, Credits, Banks, CashPots } from "../../../types/models";

const loadingStore = useLoadingStore();
const ready = ref(false);
let banks: Banks[] = reactive([]);
let cashPots: CashPots[] = reactive([]);
const { filterAll, items } = useFilter(getRevenus);
const showModalBank = ref(false);
const showModalCashPot = ref(false);
const valid = ref(false);
let mutableBank: Ref<Banks> = ref({});
let mutableCashPot: Ref<CashPots> = ref({});
const dates: string[] = [];
let revenu: Ref<(Revenus & { Costs: Costs[]; Credits: Credits[] }) | null> = ref(null);
const chartOptions = {
  responsive: true,
};
const revenuDate = computed(() => {
  if (!revenu.value) return;
  return dayjs(revenu.value.createdAt).format("MMMM YYYY");
});

const revenuBalance = computed(() => (revenu.value ? revenu.value?.total + revenu.value?.expense : 0));

onMounted(async () => {
  banks = await getBanks();
  mutableBank.value = banks[0];
  cashPots = await getCashPots();
  mutableCashPot.value = cashPots[0];
  await filterAll({
    perPage: 1,
  });

  revenu.value = items.value.rows[0];
  const today = dayjs(revenu?.value?.Costs?.at(0)?.createdAt);

  for (let i = 2; i <= today.date() + 1; i++) {
    const date = dayjs().year(today.year()).month(today.month()).date(i).format("L");
    dates.push(date);
  }
  ready.value = true;
});

const costChartData = computed(() => {
  const groupedCosts = revenu.value?.Costs.reduce((groupedCosts, cost) => {
    const date = dayjs(cost.createdAt).format("L");
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
});

const creditChartData = computed(() => {
  const groupedCredits = revenu.value?.Credits.reduce((groupedCredits, credit) => {
    const date = dayjs(credit.createdAt).format("L");
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
});

const lineChartData = computed(() => {
  const groupedCredits = revenu.value?.Credits.reduce((groupedCredits, credit) => {
    const date = dayjs(credit.createdAt).format("L");
    if (!groupedCredits[date]) {
      groupedCredits[date] = [];
    }
    groupedCredits[date].push(credit);
    return groupedCredits;
  }, {});

  const groupedCosts = revenu.value?.Costs.reduce((groupedCosts, cost) => {
    const date = dayjs(cost.createdAt).format("L");
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
});

async function handleBankSubmit(): Promise<void> {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  try {
    if (mutableBank.value.id) {
      await updateBank(mutableBank.value.id, {
        name: mutableBank.value.name,
        amount: mutableBank.value.amount,
        amountDate: dayjs(mutableBank.value.amountDate),
      });
    } else {
      await createBank(mutableBank.value);
    }
    window.location.reload();
  } finally {
    loadingStore.setLoading(false);
  }
}

async function handleCashPotSubmit(): Promise<void> {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  try {
    if (mutableCashPot.value.id) {
      await updateCashPot(mutableCashPot.value.id, mutableCashPot.value);
    } else {
      await createCashPot(mutableCashPot.value);
    }
    window.location.reload();
  } finally {
    loadingStore.setLoading(false);
  }
}

function returnBalance(model): number {
  return model.sum_costs + model.sum_credits;
}
</script>
