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
                NumberInput(name='taxPercentage' :label='$t("revenu.tax")' v-model="revenu.tax_percentage" :rules="[$v.number()]")
              v-col(cols="3" lg="2")
                v-switch(hide-details :label='$t("revenu.withholding_tax_active")' v-model="revenu.withholding_tax_active" color="secondary")

            div(v-if='revenu?.invoices?.length')
              hr.my-8
              v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.invoices") }} 
              v-row
                v-col(cols="3") {{ $t("revenu.name") }}
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="2") {{ $t("revenu.totalTTC") }}
                v-col(cols="1")
              br
              TransitionGroup(name='slide-up')
                v-row(v-for='(invoice, index) in revenu.invoices' :key="index")
                  v-col(cols="3")
                    v-text-field(:model-value="invoice.company || invoice.last_name" disabled)
                  v-col(cols="2")
                    v-text-field(:model-value="invoice.total" disabled)
                  v-col(cols="2")
                    v-text-field(:model-value="invoice.total_ttc" disabled)
                  v-col(cols="1")
                    v-btn(icon="mdi-eye" variant="plain" size="small" :to="`/customers/${invoice.customer_id}/invoices/${invoice.id}`")

            div(v-if='revenu.quotations?.length')
              v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.quotations") }}
              v-row
                v-col(cols="3") {{ $t("revenu.name") }}
                v-col(cols="2") {{ $t("revenu.deposit") }}
                v-col(cols="1")
              br
              TransitionGroup(name='slide-up')
                v-row(v-for='(quotation, index) in revenu.quotations' :key="index")
                  v-col(cols="3")
                    v-text-field(v-model="quotation.company")
                  v-col(cols="2")
                    v-text-field(:value="quotation.total * 0.3" disabled)
                  v-col(cols="1")
                    v-btn(icon="mdi-eye" variant="plain" size="small" :to="`/customers/${quotation.customer_id}/quotations/${quotation.id}`")

            hr.my-8
            v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.withdrawals") }}
            template(v-if="withdrawals.length")
              v-row
                v-col(cols="2") {{ $t("revenu.created_at") }}
                v-col(cols="3") {{ $t("revenu.name") }}
                v-col(cols="2") {{ $t("revenu.amount") }}
                v-col(cols="2") {{ $t("revenu.exchange_fees") }}
                v-col(cols="1")
              br
              v-virtual-scroll.mb-4(:items="withdrawals" :height="400" item-height="86" ref="virtual_scroll_withdrawal")
                template(v-slot:default="{ item, index }")
                  v-row
                    v-col(cols="2")
                      DateInput(v-model="item.date" :rules="[$v.required()]")
                    v-col(cols="3")
                      v-text-field(v-model="item.name" :rules="[$v.required()]")
                    v-col(cols="2")
                      NumberInput(v-model="item.amount" :rules="[$v.required(), $v.number()]")
                    v-col(cols="2")
                      NumberInput(v-model="item.exchange_fees" :rules="[$v.number()]")  
                    v-col.d-flex(cols="1")
                      v-btn(color="error" href='#' @click.prevent="removeItem(index, 'withdrawal')")
                        v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(@click.prevent="show_modal_withdrawal = true;")
                  span {{ $t("revenu.addLine") }}

            hr.my-8
            v-card-title.px-0.pb-8.d-flex.justify-space-between.align-center
              v-col(cols="12" sm="3" md="3")
                .text-h5 {{ $t("revenu.credits") }}
              v-col(cols="12" sm="9" md="9")
                v-row.justify-end
                  v-col(cols="12" sm="3" md="3")
                    v-select(:items="presentCreditCategories" item-title="name" item-value="id" @update:modelValue="(value) => creditSearchBy(value, 'category')" :label='$t("revenu.categories")' hide-details clearable)
                  v-col(cols="12" sm="3" md="3")
                    v-text-field(@update:modelValue="(value) => creditSearchBy(value, 'creditor')" :label='$t("revenu.creditor")' hide-details)
                  v-col(cols="12" sm="3" md="3")
                    NumberInput(@update:modelValue="(value) => creditSearchBy(value, 'total')" :label='$t("revenu.amount")' hide-details)

            template(v-if="credits.length")
              v-row
                v-col(cols="2") {{ $t("revenu.created_at") }}
                v-col(cols="3") {{ $t("revenu.creditor") }}
                v-col(cols="2") {{ $t("revenu.category") }}
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="2") {{ $t("revenu.asset") }}
                v-col(cols="1")
              br
              v-virtual-scroll.mb-4(:items="credits" :height="400" item-height="86" ref="virtualScrollCredit")
                template(v-slot:default="{ item, index }")
                  v-row(:class="{'bg-red-darken-4': item.credit_category_id === 1}")
                    v-col(cols="2")
                      DateInput(v-model="item.created_at")
                    v-col(cols="3")
                      v-text-field(v-model="item.creditor" :rules="[$v.required()]")
                    v-col(cols="2")
                      v-select(v-model="item.credit_category_id" :items="creditCategories" @update:modelValue="updateTotal" item-title="name" item-value="id")
                    v-col(cols="2")
                      NumberInput(v-model="item.total" @change="(event) => updateTotal(index, event, 'credit', 'total')" :rules="[$v.required(), $v.number()]")
                    v-col(cols="2")
                      v-select(:items="assets" :item-props="itemProps" v-model="item.asset_id")
                    v-col.d-flex(cols="1")
                      v-btn(color="error" href='#' @click.prevent="removeItem(index, 'Credit')")
                        v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(@click.prevent="addItem('Credit')")
                  span {{ $t("revenu.addLine") }}

            hr.my-8
            v-card-title.px-0.pb-8.d-flex.justify-space-between.align-center
              v-col(cols="12" sm="3" md="3")
                .text-h5 {{ $t("revenu.costs") }}
              v-col(cols="12" sm="9" md="9")
                v-row.justify-end
                  v-col(cols="12" sm="3" md="3")
                    v-select(:items="present_cost_categories" item-title="name" item-value="id" @update:modelValue="(value) => costSearchBy(value, 'category')" :label='$t("revenu.categories")' hide-details clearable)
                  v-col(cols="12" sm="3" md="3")
                    v-text-field(@update:modelValue="(value) => costSearchBy(value, 'name')" :label='$t("revenu.name")' hide-details clearable)
                  v-col(cols="12" sm="3" md="3")
                    NumberInput(@update:modelValue="(value) => costSearchBy(value, 'total')" :positive="false" :label='$t("revenu.amount")' hide-details clearable)

            template(v-if="costs.length")
              v-row
                v-col(cols="1") {{ $t("revenu.recurrent") }}
                v-col(cols="2") {{ $t("revenu.created_at") }}
                v-col(cols="3") {{ $t("revenu.reference") }}
                v-col(cols="2") {{ $t("revenu.category") }}
                v-col(cols="1") {{ $t("revenu.vat") }}
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="1")
              br
              v-virtual-scroll.mb-4(:items="costs" :height="400" item-height="86" ref="virtual_scroll_cost")
                template(v-slot:default="{ item, index }")
                  v-row(:class="{'bg-red-darken-4': item.cost_category_id === 1}")
                    v-col(cols="1")
                      v-checkbox(v-model="item.recurrent" color="secondary")
                    v-col(cols="2")
                      DateInput(v-model="item.created_at")
                    v-col(cols="3")
                      v-text-field(v-model="item.name" :rules="[$v.required()]")
                    v-col(cols="2")
                      v-select(v-model="item.cost_category_id" :items="costCategories" item-title="name" item-value="id")
                    v-col.pl-0(cols="1")
                      NumberInput(v-model="item.tva_amount" @change="(event) => updateTotal(index, event, 'costs', 'tva_amount')" :rules="[$v.number()]")
                    v-col.px-0(cols="1")
                      NumberInput(v-model="item.total" :positive="false" @change="(event) => updateTotal(index, event, 'costs', 'total')" :rules="[$v.required(), $v.number()]")
                    v-col.d-flex(cols="1")
                      v-btn.mr-2(color="primary" href='#' :disabled="!item.name || !item.total" @click.prevent="show_modal_cost = true; mutable_cost = item")
                        v-icon mdi-bank
                      v-btn(color="error" href='#' @click.prevent="removeItem(index, 'cost')")
                        v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(@click.prevent="addItem('cost')")
                  span {{ $t("revenu.addLine") }}

          v-dialog(v-model='show_modal_withdrawal' width='600')
            v-card(width="100%")
              v-form(v-model="valid_withdrawal" @submit.prevent="updateWithdrawal")
                v-card-title.text-center {{ $t("revenu.updateWithdrawal") }}
                v-card-text.mt-4
                  v-row(dense justify="center")
                    v-col(cols="10")
                      v-row(justify="center")
                        v-col(cols="5")
                          v-select(:items="assets" :item-props="itemProps" v-model="mutable_withdrawal.initial_asset_id" :rules="[$v.required()]" :label='$t("revenu.initial_asset")')
                        v-col.mt-3.d-flex.justify-center(cols="2")
                          v-icon mdi-arrow-right
                        v-col(cols="5")
                          v-select(:items="assets" :item-props="itemProps" v-model="mutable_withdrawal.destination_asset_id" :rules="[$v.required()]" :label='$t("revenu.destination_asset")')
                    v-col(cols="10")
                      v-select(:items="cost_withdrawals" :item-props="itemProps" v-model="mutable_withdrawal.CostId" :rules="[$v.required()]" :label='$t("revenu.costs")')
                    v-col(cols="10")
                      DateInput(v-model="mutable_withdrawal.date" :rules="[$v.required()]" :label='$t("revenu.created_at")')
                    v-col(cols="10")
                      v-text-field(v-model="mutable_withdrawal.name" :label='$t("revenu.name")' :rules="[$v.required()]")
                    v-col(cols="10")
                      NumberInput(v-model="mutable_withdrawal.amount" :rules="[$v.required(), $v.number()]" :label='$t("revenu.amount")')
                    v-col(cols="10")
                      NumberInput(v-model="mutable_withdrawal.exchange_fees" :rules="[$v.number()]" :label='$t("revenu.exchange_fees")')                

                v-card-actions.mb-2
                  v-row(dense justify="center")
                    v-col.d-flex.justify-center(cols="12" lg="8")
                      v-btn.bg-secondary.text-white(type="submit") {{ $t("revenu.update") }}

          v-dialog(v-model='show_modal_cost' width='600')
            v-card(width="100%")
              v-form(v-model="valid_cost" @submit.prevent="updateCost")
                v-card-title.text-center {{ mutable_cost.id ? $t("revenu.updateCost") : $t("revenu.createCost") }}
                v-card-text.mt-4
                  v-row(dense justify="center")
                    v-col(cols="10")
                      v-select(:items="payment_means" v-model="mutable_cost.payment_mean" :label='$t("revenu.payment_mean")')
                    v-col(cols="10")
                      v-select(:items="assets" :item-props="itemProps" v-model="mutable_cost.asset_id" :label='$t("revenu.asset")')
                v-card-actions.mb-2
                  v-row(dense justify="center")
                    v-col.d-flex.justify-center(cols="12" lg="8")
                      v-btn.bg-secondary.text-white(type="submit") {{ mutable_cost.id ? $t("revenu.update") : $t("revenu.create") }}

          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn(color="primary" @click='router.go(-1)') {{ "Retour" }}
                v-btn(color="secondary" type="submit") {{ "Editer un revenu" }}
    v-col(cols='12' lg="4")
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
            v-card-title {{ $n(revenu?.investments, "currency") }}
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
      v-card.mt-4(v-if="credits.length")
        v-card-title.text-center.mb-2 {{ $t("revenu.revenus") }} {{ revenu.total }} €
        v-card-text
          PieChart(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')
      v-card.mt-4(v-if="costs.length")
        v-card-title.text-center.mb-2 {{ $t("revenu.costs") }} {{ revenu.expense }} €
        v-card-text
          PieChart(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
      v-card.mt-4(v-if="recurrent_costs.length")
        v-card-title.text-center.mb-2 {{ $t("revenu.recurrents") }}
        v-card-text
          v-row(align="center" class="ml-1 mt-1" v-for='recurrent_cost in recurrent_costs' closable-chips :key="recurrent_cost.id")
            .text-caption - {{ recurrent_cost.name }}
            v-card-title {{ $n(recurrent_cost.total, "currency") }}

      v-card.mt-4
        v-card-title.text-center.mb-2 {{ $t("revenu.watchers") }}
        v-card-text
          v-autocomplete(
            chips
            :items="costsNames"
            v-model="revenu.watchers"
            multiple)

          v-row(align="center" class="ml-1 mt-1" v-for='watcher in splitedWatchers' closable-chips :key="watcher")
            .text-caption - {{ watcher }}
            v-card-title {{ $n(revenu.costs.filter((c) => c.name.includes(watcher)).reduce((sum, c) => sum + c.total, 0), "currency") }}
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import type {
  revenu,
  cost,
  credit,
  invoice,
  quotation,
  withdrawal,
  Prisma,
  asset,
  cost_category,
  credit_category,
} from "../../../types/models";
import {
  getRevenu,
  updateRevenu,
  getAssets,
  updateOrCreateRevenuCost,
  createRevenuWithdrawal,
  getCategories,
} from "../../utils/generated/api-user";

type RevenuWithCostsCredits = revenu & {
  costs: cost[];
  credits: credit[];
  invoices: invoice[];
  quotations: quotation[];
  withdrawals: withdrawal[];
};

const loadingStore = useLoadingStore();
const route = useRoute();
const router = useRouter();
const valid = ref(false);
const valid_withdrawal = ref(false);
const valid_cost = ref(false);
const show_modal_cost = ref(false);
const show_modal_withdrawal = ref(false);
const mutable_cost = ref();
let withdrawal_item_template = {
  date: dayjs().toDate(),
  name: "",
  amount: 0,
  exchange_fees: 0,
  revenu_id: 0,
  initial_asset_id: 0,
  destination_asset_id: 0,
  cost_id: 0,
};
const mutable_withdrawal = ref();
const revenu = ref<RevenuWithCostsCredits>();
const assets = ref<asset[]>([]);
const costs = ref<Prisma.costUncheckedCreateInput[]>([]);
const credits = ref<Prisma.creditUncheckedCreateInput[]>([]);
const withdrawals = ref<Prisma.withdrawalUncheckedCreateInput[]>([]);
const costCategories = ref<cost_category[]>([]);
const creditCategories = ref<credit_category[]>([]);
const credit_item_template = {
  total: 0,
  creditor: "",
  credit_category_id: 1,
  reason: "",
  revenu_id: 0,
};
const payment_means = ["CARD", "CASH"];
const virtual_scroll_cost = ref();
const virtualScrollCredit = ref();
const virtual_scroll_withdrawal = ref();
const costChartData = ref();
const creditChartData = ref();
const chartOptions = {
  responsive: true,
};

const cost_item_template: Prisma.costUncheckedCreateInput = {
  total: 0,
  name: "",
  cost_category_id: 1,
  tva_amount: 0,
  revenu_id: 0,
  recurrent: false,
};

onMounted(async () => {
  try {
    loadingStore.setLoading(true);
    const response = await getAssets({ perPage: 1000 });
    assets.value = response.rows;
    revenu.value = await getRevenu(route.params.id);
    const { cost_categories, credit_categories } = await getCategories();
    costCategories.value = cost_categories;
    creditCategories.value = credit_categories;
    if (!revenu.value) return;
    revenu.value.watchers = revenu.value?.watchers?.length ? revenu.value?.watchers?.split(",") : [];
    costs.value = revenu.value.costs;
    credits.value = revenu.value.credits;
    withdrawals.value = revenu.value.withdrawals;
    credit_item_template.revenu_id = revenu.value?.id;
    cost_item_template.revenu_id = revenu.value?.id;
    withdrawal_item_template = {
      ...withdrawal_item_template,
      revenu_id: revenu.value?.id,
      initial_asset_id: assets.value?.[0]?.id,
      destination_asset_id: assets.value.find((a) => a.asset_type_id === 9)?.id || 0,
    };
    mutable_withdrawal.value = {
      ...withdrawal_item_template,
      ...(cost_withdrawals.value.length && {
        cost_id: cost_withdrawals.value[0].id,
        date: dayjs(cost_withdrawals.value[0].created_at).toDate(),
      }),
    };
  } finally {
    loadingStore.setLoading(false);
  }
});

function addItem(itemName) {
  if (itemName === "cost") {
    const created_at = costs.value.at(-1)?.created_at || revenu.value?.created_at;
    costs.value.push({ created_at, ...cost_item_template });
    setTimeout(() => {
      virtual_scroll_cost.value.scrollToIndex(costs.value.length);
    }, 0);
  } else if (itemName === "Credit") {
    const created_at = credits.value.at(-1)?.created_at || revenu.value?.created_at;
    credits.value.push({ created_at, ...credit_item_template });
    setTimeout(() => {
      virtualScrollCredit.value.scrollToIndex(credits.value.length);
    }, 0);
  } else {
    const created_at = withdrawals.value.at(-1)?.created_at || revenu.value?.created_at;
    withdrawals.value.push({ created_at, ...withdrawal_item_template });
    setTimeout(() => {
      virtual_scroll_withdrawal.value.scrollToIndex(withdrawals.value.length);
    }, 0);
  }
}

function removeItem(index, itemName) {
  if (itemName === "cost") {
    costs.value.splice(index, 1);
    updateTotal();
  } else if (itemName === "Credit") {
    credits.value.splice(index, 1);
    updateTotal();
  } else {
    withdrawals.value.splice(index, 1);
  }
}

function updateTotal(index = 0, event = 0, modelName = "", columnName = "") {
  // TODO: fetch total from backend as the logic is getting complicated
  if (index && event && modelName) {
    revenu.value[modelName][index][columnName] = +event.target.value;
  }
  if (!revenu.value) return;
  let tvaCollected = 0;
  let totalInvoices = 0;
  for (let invoice of revenu.value.invoices) {
    tvaCollected += +invoice.tva_amount;
    totalInvoices += +invoice.total;
  }

  let tvaDispatched = 0;
  let total_costs = 0;
  let totalInvestments = 0;
  for (let cost of costs.value) {
    if (cost.cost_category_id === 15) continue;
    if (cost.tva_amount) {
      tvaDispatched += Number(cost.tva_amount || 0);
    }

    if (cost.cost_category_id === 10) {
      totalInvestments += +cost.total;
    } else {
      total_costs += +cost.total;
    }
  }

  let totalSalary = 0;
  let totalBncPro = 0;
  let totalPerso = 0;
  let totalRefund = 0;
  for (let credit of credits.value) {
    if (credit.credit_category_id === 6) continue;
    if (credit.credit_category_id === 10) {
      totalSalary += +credit.total;
    } else if (credit.credit_category_id === 8) {
      totalRefund += +credit.total;
    } else if (credit.credit_category_id === 16) {
      totalBncPro += +credit.total;
    } else if (credit.credit_category_id !== 10) {
      totalPerso += +credit.total;
    }
  }

  revenu.value.salary = totalSalary;
  revenu.value.bnc_pro = totalBncPro;
  revenu.value.perso = totalPerso;
  revenu.value.refund = totalRefund;
  revenu.value.total = totalBncPro + totalSalary + totalPerso;
  revenu.value.expense = total_costs;
  revenu.value.investments = totalInvestments;
  revenu.value.tax_amount = calculateTaxAmount(revenu.value.total);
  revenu.value.tva_balance = tvaDispatched - tvaCollected;
  revenu.value.balance = total_costs + revenu.value.total || 0;
}

function calculateTaxAmount(total) {
  // TODO: calculer sur le taux marginal d'imposition
  return Math.round(total);
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
  return dayjs(revenu.value.created_at).format("MMMM YYYY");
});

const cost_category_ids = computed(() => {
  return costs.value ? costs.value.map((cost) => cost.cost_category_id) : [];
});

const computedCreditCategories = computed(() => {
  return credits.value ? credits.value.map((credit) => credit.credit_category_id) : [];
});

function groupModelByCategory(models, model_name, items) {
  if (!models) return;
  const groupedModel = models.value.reduce((acc, item) => {
    const category = model_name === "credits" ? "credit_category_id" : "cost_category_id";
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

watch(cost_category_ids, () => groupModelByCategory(costs, "costs", costCategories));
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
  () => mutable_withdrawal.value?.CostId,
  () => {
    if (!mutable_withdrawal.value?.CostId) return;
    const index = cost_withdrawals.value.findIndex((cw) => cw.id === mutable_withdrawal.value?.CostId);
    mutable_withdrawal.value.amount = Math.abs(cost_withdrawals.value[index].total);
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

const recurrent_costs = computed(() => {
  return costs.value.filter((c) => c.recurrent) || [];
});

const cost_withdrawals = computed(() => {
  return costs.value.filter((c) => c.name.includes("DAB") && !c.withdrawal_id);
});

function itemProps(item) {
  return {
    title: item.name,
    value: item.id,
  };
}

async function updateCost() {
  if (!valid_cost.value) return;
  loadingStore.setLoading(true);
  try {
    const res = await updateOrCreateRevenuCost(revenu.value?.id, mutable_cost.value.id, {
      created_at: mutable_cost.value.created_at,
      name: mutable_cost.value.name,
      total: mutable_cost.value.total,
      tva_amount: mutable_cost.value.tva_amount,
      recurrent: mutable_cost.value.recurrent,
      cost_category_id: mutable_cost.value.cost_category_id,
      payment_mean: mutable_cost.value.payment_mean,
      revenu_id: revenu.value?.id,
      asset_id: mutable_cost.value.asset_id,
    });
    const costIndex = costs.value.findIndex((c) => c.id === res.id);
    costs.value[costIndex] = {
      ...costs.value[costIndex],
      payment_mean: mutable_cost.value.payment_mean,
      asset_id: mutable_cost.value.asset_id,
    };
    show_modal_cost.value = false;
  } finally {
    loadingStore.setLoading(false);
  }
}

async function updateWithdrawal() {
  if (!valid_withdrawal.value) return;
  loadingStore.setLoading(true);
  try {
    const { withdrawal, cost, credit } = await createRevenuWithdrawal(revenu.value?.id, {
      date: mutable_withdrawal.value.date,
      name: mutable_withdrawal.value.name,
      amount: mutable_withdrawal.value.amount,
      exchange_fees: mutable_withdrawal.value.exchange_fees,
      initial_asset_id: mutable_withdrawal.value.initial_asset_id,
      destination_asset_id: mutable_withdrawal.value.destination_asset_id,
      cost_id: mutable_withdrawal.value.cost_id,
    });
    const costIndex = costs.value.findIndex((c) => c.id === cost.id);
    if (costIndex !== -1) {
      costs.value[costIndex] = cost;
    } else {
      costs.value.push(cost);
    }
    credits.value.push(credit);
    withdrawals.value.push(withdrawal);
    show_modal_withdrawal.value = false;
    mutable_withdrawal.value = {
      ...withdrawal_item_template,
      date: dayjs(cost_withdrawals.value[0].created_at).toDate(),
      ...(cost_withdrawals.value.length && { CostId: cost_withdrawals.value[0].id }),
    };
  } finally {
    loadingStore.setLoading(false);
  }
}

const presentCreditCategories = computed(() => {
  if (!creditCategories.value?.length) return;
  const presentCreditCategories = {};
  for (let credit of credits.value) {
    if (!credit.credit_category_id) return;
    if (!presentCreditCategories[credit.credit_category_id]) {
      presentCreditCategories[+credit.credit_category_id] = 1;
    }
  }

  const presentCreditCategoriesKeys = Object.keys(presentCreditCategories);
  return creditCategories.value.filter((c) => presentCreditCategoriesKeys.includes("" + c.id));
});

const present_cost_categories = computed(() => {
  if (!costCategories.value?.length) return;
  const present_cost_categories = {};
  for (let cost of costs.value) {
    if (!cost.cost_category_id) return;
    if (!present_cost_categories[cost.cost_category_id]) {
      present_cost_categories[+cost.cost_category_id] = 1;
    }
  }

  const present_cost_categories_keys = Object.keys(present_cost_categories);
  return costCategories.value.filter((c) => present_cost_categories_keys.includes("" + c.id));
});

function creditSearchBy(value: Number | String, attribute: String) {
  if (!value) {
    return (credits.value = revenu.value.credits);
  }
  credits.value = revenu.value.credits.filter((c) => {
    if (attribute === "category") {
      return c.credit_category_id === value;
    } else if (attribute === "creditor") {
      return c.creditor.toLowerCase().includes(value.toLowerCase());
    } else if (attribute === "total") {
      return c.total === +value;
    }
  });
}

function costSearchBy(value: Number | String, attribute: String) {
  if (!value) {
    return (costs.value = revenu.value.costs);
  }
  costs.value = revenu.value.costs.filter((c) => {
    if (attribute === "category") {
      return c.cost_category_id === value;
    } else if (attribute === "name") {
      return c.name.toLowerCase().includes(value.toLowerCase());
    } else if (attribute === "total") {
      return c.total === +value;
    }
  });
}
</script>
