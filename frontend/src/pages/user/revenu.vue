<template lang="pug">
v-container
  v-row(v-if="revenu")
    v-col(cols='12' lg="8")
      v-card.pa-4
        v-form(v-model="valid" @submit.prevent="handleSubmit")
          v-card-title 
            v-row.mb-4(align="center")
              v-btn(icon="mdi-arrow-left" variant="text" @click='router.go(-1)')
              span {{ $t("revenu.editRevenu", [revenuMonth])  }}

          v-card-text
            v-row(dense)
              v-col(cols="2")
                NumberInput(name='taxPercentage' :label='$t("revenu.tax")' v-model="revenu.taxPercentage" :rules="[$v.number()]")

            div(v-if='revenu?.Invoices?.length')
              hr.my-8
              v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.invoices") }} 
              v-row
                v-col(cols="3") {{ $t("revenu.name") }}
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="2") {{ $t("revenu.totalTTC") }}
                v-col(cols="1")
              br
              TransitionGroup(name='slide-up')
                v-row(v-for='(invoice, index) in revenu.Invoices' :key="index")
                  v-col(cols="3")
                    v-text-field(:model-value="invoice.company || invoice.lastName" disabled)
                  v-col(cols="2")
                    v-text-field(:model-value="invoice.total" disabled)
                  v-col(cols="2")
                    v-text-field(:model-value="invoice.totalTTC" disabled)
                  v-col(cols="1")
                    v-btn(icon="mdi-eye" variant="plain" size="small" :to="`/customers/${invoice.CustomerId}/invoices/${invoice.id}`")

            div(v-if='revenu.Quotations?.length')
              v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.quotations") }}
              v-row
                v-col(cols="3") {{ $t("revenu.name") }}
                v-col(cols="2") {{ $t("revenu.deposit") }}
                v-col(cols="1")
              br
              TransitionGroup(name='slide-up')
                v-row(v-for='(quotation, index) in revenu.Quotations' :key="index")
                  v-col(cols="3")
                    v-text-field(v-model="quotation.company")
                  v-col(cols="2")
                    v-text-field(:value="quotation.total * 0.3" disabled)
                  v-col(cols="1")
                    v-btn(icon="mdi-eye" variant="plain" size="small" :to="`/customers/${quotation.CustomerId}/quotations/${quotation.id}`")

            hr.my-8
            v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.withdrawals") }}
            template(v-if="withdrawals.length")
              v-row
                v-col(cols="2") {{ $t("revenu.createdAt") }}
                v-col(cols="3") {{ $t("revenu.name") }}
                v-col(cols="2") {{ $t("revenu.amount") }}
                v-col(cols="2") {{ $t("revenu.exchangeFees") }}
                v-col(cols="1")
              br
              v-virtual-scroll.mb-4(:items="withdrawals" :height="400" item-height="86" ref="virtualScrollWithdrawal")
                template(v-slot:default="{ item }")
                  v-row
                    v-col(cols="2")
                      DateInput(v-model="item.date" :rules="[$v.required()]")
                    v-col(cols="3")
                      v-text-field(v-model="item.name" :rules="[$v.required()]")
                    v-col(cols="2")
                      NumberInput(v-model="item.amount" :rules="[$v.required(), $v.number()]")
                    v-col(cols="2")
                      NumberInput(v-model="item.exchangeFees" :rules="[$v.number()]")  
                    v-col.d-flex(cols="1")
                      v-btn(color="error" href='#' @click.prevent="removeItem(item, 'Withdrawal')")
                        v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(@click.prevent="showModalWithdrawal = true;")
                  span {{ $t("revenu.addLine") }}

            hr.my-8
            v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.credits") }}
            template(v-if="credits.length")
              v-row
                v-col(cols="2") {{ $t("revenu.createdAt") }}
                v-col(cols="3") {{ $t("revenu.creditor") }}
                v-col(cols="2") {{ $t("revenu.category") }}
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="2") {{ $t("revenu.bank") }}
                v-col(cols="1")
              br
              v-virtual-scroll.mb-4(:items="credits" :height="400" item-height="86" ref="virtualScrollCredit")
                template(v-slot:default="{ item, index }")
                  v-row(:class="{'bg-red-darken-4': item.CreditCategoryId === 1}")
                    v-col(cols="2")
                      DateInput(v-model="item.createdAt")
                    v-col(cols="3")
                      v-text-field(v-model="item.creditor" :rules="[$v.required()]")
                    v-col(cols="2")
                      v-select(v-model="item.CreditCategoryId" :items="creditCategories" @update:modelValue="updateTotal" item-title="name" item-value="id")
                    v-col(cols="2")
                      NumberInput(v-model="item.total" @change="(event) => updateTotal(index, event, 'Credits', 'total')" :rules="[$v.required(), $v.number()]")
                    v-col(cols="2")
                      v-select(v-if="item.CreditCategoryId === 14" :items="cashPots" :item-props="itemProps" v-model="item.CashPotId")
                      v-select(v-else :items="banks" :item-props="itemProps" v-model="item.BankId")
                    v-col.d-flex(cols="1")
                      v-btn(color="error" href='#' @click.prevent="removeItem(item, 'Credit')")
                        v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(@click.prevent="addItem('Credit')")
                  span {{ $t("revenu.addLine") }}

            hr.my-8
            v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.costs") }}
            template(v-if="costs.length")
              v-row
                v-col(cols="1") {{ $t("revenu.recurrent") }}
                v-col(cols="2") {{ $t("revenu.createdAt") }}
                v-col(cols="3") {{ $t("revenu.reference") }}
                v-col(cols="2") {{ $t("revenu.category") }}
                v-col(cols="1") {{ $t("revenu.vat") }}
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="1")
              br
              v-virtual-scroll.mb-4(:items="costs" :height="400" item-height="86" ref="virtualScrollCost")
                template(v-slot:default="{ item, index }")
                  v-row(:class="{'bg-red-darken-4': item.CostCategoryId === 1}")
                    v-col(cols="1")
                      v-checkbox(v-model="item.recurrent" color="secondary")
                    v-col(cols="2")
                      DateInput(v-model="item.createdAt")
                    v-col(cols="3")
                      v-text-field(v-model="item.name" :rules="[$v.required()]")
                    v-col(cols="2")
                      v-select(v-model="item.CostCategoryId" :items="costCategories" item-title="name" item-value="id")
                    v-col.pl-0(cols="1")
                      NumberInput(v-model="item.tvaAmount" @change="(event) => updateTotal(index, event, 'Costs', 'tvaAmount')" :rules="[$v.number()]")
                    v-col.px-0(cols="1")
                      NumberInput(v-model="item.total" :positive="false" @change="(event) => updateTotal(index, event, 'Costs', 'total')" :rules="[$v.required(), $v.number()]")
                    v-col.d-flex(cols="1")
                      v-btn.mr-2(color="primary" href='#' :disabled="!item.name || !item.total" @click.prevent="showModalCost = true; mutableCost = item")
                        v-icon mdi-bank
                      v-btn(color="error" href='#' @click.prevent="removeItem(item, 'Cost')")
                        v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(@click.prevent="addItem('Cost')")
                  span {{ $t("revenu.addLine") }}

          v-dialog(v-model='showModalWithdrawal' width='600')
            v-card(width="100%")
              v-form(v-model="validWithdrawal" @submit.prevent="updateWithdrawal")
                v-card-title.text-center {{ $t("revenu.updateWithdrawal") }}
                v-card-text.mt-4
                  v-row(dense justify="center")
                    v-col(cols="10")
                      v-row(justify="center")
                        v-col(cols="5")
                          v-select(:items="banks" :item-props="itemProps" v-model="mutableWithdrawal.BankId" :rules="[$v.required()]" :label='$t("revenu.bank")')
                        v-col.mt-3.d-flex.justify-center(cols="2")
                          v-icon mdi-arrow-right
                        v-col(cols="5")
                          v-select(:items="cashPots" :item-props="itemProps" v-model="mutableWithdrawal.CashPotId" :rules="[$v.required()]" :label='$t("revenu.CashPot")')
                    v-col(cols="10")
                      v-select(:items="costWithdrawals" :item-props="itemProps" v-model="mutableWithdrawal.CostId" :rules="[$v.required()]" :label='$t("revenu.costs")')
                    v-col(cols="10")
                      DateInput(v-model="mutableWithdrawal.date" :rules="[$v.required()]" :label='$t("revenu.createdAt")')
                    v-col(cols="10")
                      v-text-field(v-model="mutableWithdrawal.name" :label='$t("revenu.name")' :rules="[$v.required()]")
                    v-col(cols="10")
                      NumberInput(v-model="mutableWithdrawal.amount" :rules="[$v.required(), $v.number()]" :label='$t("revenu.amount")')
                    v-col(cols="10")
                      NumberInput(v-model="mutableWithdrawal.exchangeFees" :rules="[$v.number()]" :label='$t("revenu.exchangeFees")')                

                v-card-actions.mb-2
                  v-row(dense justify="center")
                    v-col.d-flex.justify-center(cols="12" lg="8")
                      v-btn.bg-secondary.text-white(type="submit") {{ $t("revenu.update") }}

          v-dialog(v-model='showModalCost' width='600')
            v-card(width="100%")
              v-form(v-model="validCost" @submit.prevent="updateCost")
                v-card-title.text-center {{ mutableCost.id ? $t("revenu.updateCost") : $t("revenu.createCost") }}
                v-card-text.mt-4
                  v-row(dense justify="center")
                    v-col(cols="10")
                      v-select(:items="paymentMeans" v-model="mutableCost.paymentMean" :label='$t("revenu.paymentMean")')
                    v-col(cols="10")
                      v-select(v-if="mutableCost.paymentMean === 'CARD'" :items="banks" :item-props="itemProps" v-model="mutableCost.BankId" :label='$t("revenu.bank")')
                      v-select(v-else :items="cashPots" :item-props="itemProps" v-model="mutableCost.CashPotId" :label='$t("revenu.CashPot")')
                v-card-actions.mb-2
                  v-row(dense justify="center")
                    v-col.d-flex.justify-center(cols="12" lg="8")
                      v-btn.bg-secondary.text-white(type="submit") {{ mutableCost.id ? $t("revenu.update") : $t("revenu.create") }}

          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn(color="primary" @click='router.go(-1)') {{ "Retour" }}
                v-btn(color="secondary" type="submit") {{ "Editer un revenu" }}
    v-col(cols='12' lg="4")
      TotalField(
        :initial-total='revenu.total',
        :model='revenu'
      )
      v-card.mt-4(v-if="credits.length")
        v-card-title.text-center.mb-2 {{ $t("revenu.revenus") }} {{ revenu.total }} €
        v-card-text
          PieChart(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')
      v-card.mt-4(v-if="costs.length")
        v-card-title.text-center.mb-2 {{ $t("revenu.costs") }} {{ revenu.expense }} €
        v-card-text
          PieChart(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
      v-card.mt-4(v-if="recurrentCosts.length")
        v-card-title.text-center.mb-2 {{ $t("revenu.recurrents") }}
        v-card-text
          v-row(align="center" class="ml-1 mt-1" v-for='recurrentCost in recurrentCosts' closable-chips :key="recurrentCost.id")
            v-card-subtitle - {{ recurrentCost.name }}
            v-card-title {{ $n(recurrentCost.total, "currency") }}

      v-card.mt-4
        v-card-title.text-center.mb-2 {{ $t("revenu.watchers") }}
        v-card-text
          v-autocomplete(
            chips
            :items="costsNames"
            v-model="revenu.watchers"
            multiple)

          v-row(align="center" class="ml-1 mt-1" v-for='watcher in splitedWatchers' closable-chips :key="watcher")
            v-card-subtitle - {{ watcher }}
            v-card-title {{ $n(revenu.Costs.filter((c) => c.name.includes(watcher)).reduce((sum, c) => sum + c.total, 0), "currency") }}
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import type {
  Revenus,
  Costs,
  Credits,
  Invoices,
  Quotations,
  Withdrawal,
  Prisma,
  Banks,
  CashPots,
  cost_category,
  credit_category,
} from "../../../types/models";
import {
  getRevenu,
  updateRevenu,
  getBanks,
  getCashPots,
  updateOrCreateRevenuCost,
  createRevenuWithdrawal,
  getCategories,
} from "../../utils/generated/api-user";

type RevenuWithCostsCredits = Revenus & {
  Costs: Costs[];
  Credits: Credits[];
  Invoices: Invoices[];
  Quotations: Quotations[];
  Withdrawals: Withdrawal[];
};

const loadingStore = useLoadingStore();
const route = useRoute();
const router = useRouter();
const valid = ref(false);
const validWithdrawal = ref(false);
const validCost = ref(false);
const showModalCost = ref(false);
const showModalWithdrawal = ref(false);
const mutableCost = ref();
let withdrawalItemTemplate = {
  date: dayjs().toDate(),
  name: "",
  amount: 0,
  exchangeFees: 0,
  RevenuId: 0,
  BankId: 0,
  CashPotId: 0,
  CostId: 0,
};
const mutableWithdrawal = ref();
const revenu = ref<RevenuWithCostsCredits>();
const banks = ref<Banks[]>([]);
const cashPots = ref<CashPots[]>([]);
const costs = ref<Prisma.CostsUncheckedCreateInput[]>([]);
const credits = ref<Prisma.CreditsUncheckedCreateInput[]>([]);
const withdrawals = ref<Prisma.WithdrawalUncheckedCreateInput[]>([]);
const costCategories = ref<cost_category[]>([]);
const creditCategories = ref<credit_category[]>([]);
const creditItemTemplate = {
  total: 0,
  creditor: "",
  CreditCategoryId: 1,
  reason: "",
  RevenuId: 0,
};
const paymentMeans = ["CARD", "CASH"];
const virtualScrollCost = ref();
const virtualScrollCredit = ref();
const virtualScrollWithdrawal = ref();
const costChartData = ref();
const creditChartData = ref();
const chartOptions = {
  responsive: true,
};

const costItemTemplate: Prisma.CostsUncheckedCreateInput = {
  total: 0,
  name: "",
  CostCategoryId: 1,
  tvaAmount: 0,
  RevenuId: 0,
  recurrent: false,
};

onMounted(async () => {
  try {
    loadingStore.setLoading(true);
    banks.value = await getBanks();
    cashPots.value = await getCashPots();
    revenu.value = await getRevenu(route.params.id);
    const { cost_categories, credit_categories } = await getCategories();
    costCategories.value = cost_categories;
    creditCategories.value = credit_categories;
    if (!revenu.value) return;
    revenu.value.watchers = revenu.value?.watchers?.length ? revenu.value?.watchers?.split(",") : [];
    costs.value = revenu.value.Costs;
    credits.value = revenu.value.Credits;
    withdrawals.value = revenu.value.Withdrawals;
    creditItemTemplate.RevenuId = revenu.value?.id;
    costItemTemplate.RevenuId = revenu.value?.id;
    withdrawalItemTemplate = {
      ...withdrawalItemTemplate,
      RevenuId: revenu.value?.id,
      BankId: banks.value[0].id,
      CashPotId: cashPots.value[0].id,
    };
    mutableWithdrawal.value = {
      ...withdrawalItemTemplate,
      ...(costWithdrawals.value.length && {
        CostId: costWithdrawals.value[0].id,
        date: dayjs(costWithdrawals.value[0].createdAt).toDate(),
      }),
    };
  } finally {
    loadingStore.setLoading(false);
  }
});

function addItem(itemName) {
  if (itemName === "Cost") {
    const createdAt = costs.value.at(-1)?.createdAt || revenu.value?.createdAt;
    costs.value.push({ createdAt, ...costItemTemplate });
    setTimeout(() => {
      virtualScrollCost.value.scrollToIndex(costs.value.length);
    }, 0);
  } else if (itemName === "Credit") {
    const createdAt = credits.value.at(-1)?.createdAt || revenu.value?.createdAt;
    credits.value.push({ createdAt, ...creditItemTemplate });
    setTimeout(() => {
      virtualScrollCredit.value.scrollToIndex(credits.value.length);
    }, 0);
  } else {
    const createdAt = withdrawals.value.at(-1)?.createdAt || revenu.value?.createdAt;
    withdrawals.value.push({ createdAt, ...withdrawalItemTemplate });
    setTimeout(() => {
      virtualScrollWithdrawal.value.scrollToIndex(withdrawals.value.length);
    }, 0);
  }
}

function removeItem(item, itemName) {
  if (itemName === "Cost") {
    const index = costs.value.findIndex((cost) => cost.id === item.id);
    costs.value.splice(index, 1);
    updateTotal();
  } else if (itemName === "Credit") {
    const index = credits.value.findIndex((credit) => credit.id === item.id);
    credits.value.splice(index, 1);
    updateTotal();
  } else {
    const index = withdrawals.value.findIndex((withdrawal) => withdrawal.id === item.id);
    withdrawals.value.splice(index, 1);
  }
}

function updateTotal(index = 0, event = 0, modelName = "", columnName = "") {
  if (index && event && modelName) {
    revenu.value[modelName][index][columnName] = +event.target.value;
  }
  if (!revenu.value) return;
  const tvaCollected = revenu.value.Invoices.reduce((sum, invoice) => sum + +invoice.tvaAmount, 0);
  const tvaDispatched = costs.value.reduce((sum, cost) => sum + Number(cost.tvaAmount), 0);
  const totalInvoices = revenu.value.Invoices.reduce((sum, invoice) => sum + +invoice.total, 0);
  const totalPro = credits.value
    .filter((c) => c.CreditCategoryId === 10)
    .reduce((sum, credit) => sum + +credit.total, 0);
  const totalPerso = credits.value
    .filter((c) => c.CreditCategoryId !== 10)
    .reduce((sum, credit) => sum + +credit.total, 0);
  const totalCosts = costs.value.reduce((sum, cost) => sum + Number(cost.total), 0);

  revenu.value.tva_dispatched = tvaDispatched;
  revenu.value.tva_collected = tvaCollected;
  revenu.value.expense = totalCosts;
  revenu.value.pro = totalInvoices + totalPro;
  revenu.value.perso = totalPerso;
  revenu.value.total = totalInvoices + totalPro + totalPerso;
}

async function handleSubmit() {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  try {
    const res = await updateRevenu(revenu.value.id, revenu.value);
    if (res && res.id) {
      router.push(`/revenus`);
    }
  } finally {
    loadingStore.setLoading(false);
  }
}

const revenuMonth = computed(() => {
  if (!revenu.value) return;
  return dayjs(revenu.value.createdAt).format("MMMM YYYY");
});

const computedCostCategories = computed(() => {
  return costs.value ? costs.value.map((cost) => cost.CostCategoryId) : [];
});

const computedCreditCategories = computed(() => {
  return credits.value ? credits.value.map((credit) => credit.CreditCategoryId) : [];
});

function groupModelByCategory(models, model_name, items) {
  if (!models) return;
  const groupedModel = models.value.reduce((acc, item) => {
    const category = model_name === "credits" ? "CreditCategoryId" : "CostCategoryId";
    if (!acc[item[category]]) {
      acc[item[category]] = {
        category: item[category],
        [`${model_name}`]: [],
      };
    }

    acc[item[category]][`${model_name}`].push(item);
    return acc;
  }, {});

  const modelTotalByCategory = items.value.map((category) => {
    if (groupedModel[category.id]) {
      return groupedModel[category.id][`${model_name}`].reduce((sum, model) => sum + model.total, 0);
    } else {
      return 0;
    }
  });

  const chart = {
    labels: items.value.map((i) => i.name),
    datasets: [
      {
        data: modelTotalByCategory,
        backgroundColor: items.value.map((i) => i.color),
      },
    ],
  };

  return model_name === "costs" ? (costChartData.value = chart) : (creditChartData.value = chart);
}

watch(computedCostCategories, () => groupModelByCategory(costs, "costs", costCategories));
watch(computedCreditCategories, () => groupModelByCategory(credits, "credits", creditCategories));
watch(
  () => revenu.value?.total,
  () => groupModelByCategory(credits, "credits", creditCategories),
);
watch(
  () => revenu.value?.expense,
  () => groupModelByCategory(costs, "costs", costCategories),
);
watch(
  () => mutableWithdrawal.value?.CostId,
  () => {
    if (!mutableWithdrawal.value?.CostId) return;
    const index = costWithdrawals.value.findIndex((cw) => cw.id === mutableWithdrawal.value?.CostId);
    mutableWithdrawal.value.amount = Math.abs(costWithdrawals.value[index].total);
  },
);

const costsNames = computed(() => {
  const arr = costs.value ? costs.value.map((cost) => cost.name.replace(/[\d+/+]/g, "").trim()) : [];

  return [...new Set(arr)];
});

const splitedWatchers = computed(() => {
  if (!revenu.value) return;
  let watchers = revenu.value.watchers;
  if (!!watchers && typeof watchers === "object") {
    return (watchers = Object.entries(watchers).map((i) => i[1]));
  } else if (!!watchers && typeof watchers === "string") {
    return watchers.split(",");
  } else {
    return [];
  }
});

const recurrentCosts = computed(() => {
  return costs.value.filter((c) => c.recurrent) || [];
});

const costWithdrawals = computed(() => {
  return costs.value.filter((c) => c.name.includes("DAB") && !c.WithdrawalId);
});

function itemProps(item) {
  return {
    title: item.name,
    value: item.id,
  };
}

async function updateCost() {
  if (!validCost.value) return;
  loadingStore.setLoading(true);
  try {
    const res = await updateOrCreateRevenuCost(revenu.value?.id, mutableCost.value.id, {
      createdAt: mutableCost.value.createdAt,
      name: mutableCost.value.name,
      total: mutableCost.value.total,
      tvaAmount: mutableCost.value.tvaAmount,
      recurrent: mutableCost.value.recurrent,
      CostCategoryId: mutableCost.value.CostCategoryId,
      paymentMean: mutableCost.value.paymentMean,
      RevenuId: revenu.value?.id,
      BankId: mutableCost.value.BankId,
      CashPotId: mutableCost.value.CashPotId,
    });
    const costIndex = costs.value.findIndex((c) => c.id === res.id);
    costs.value[costIndex] = {
      ...costs.value[costIndex],
      paymentMean: mutableCost.value.paymentMean,
      BankId: mutableCost.value.BankId,
      CashPotId: mutableCost.value.CashPotId,
    };
    showModalCost.value = false;
  } finally {
    loadingStore.setLoading(false);
  }
}

async function updateWithdrawal() {
  if (!validWithdrawal.value) return;
  loadingStore.setLoading(true);
  try {
    const { withdrawal, cost, credit } = await createRevenuWithdrawal(revenu.value?.id, {
      date: mutableWithdrawal.value.date,
      name: mutableWithdrawal.value.name,
      amount: mutableWithdrawal.value.amount,
      exchangeFees: mutableWithdrawal.value.exchangeFees,
      BankId: mutableWithdrawal.value.BankId,
      CashPotId: mutableWithdrawal.value.CashPotId,
      CostId: mutableWithdrawal.value.CostId,
    });
    const costIndex = costs.value.findIndex((c) => c.id === cost.id);
    if (costIndex !== -1) {
      costs.value[costIndex] = cost;
    } else {
      costs.value.push(cost);
    }
    credits.value.push(credit);
    withdrawals.value.push(withdrawal);
    showModalWithdrawal.value = false;
    mutableWithdrawal.value = {
      ...withdrawalItemTemplate,
      date: dayjs(costWithdrawals.value[0].createdAt).toDate(),
      ...(costWithdrawals.value.length && { CostId: costWithdrawals.value[0].id }),
    };
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
