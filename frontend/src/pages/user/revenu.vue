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
                NumberInput(name='taxPercentage' :label='$t("revenu.tax")'  v-model="revenu.taxPercentage" :rules="[$v.required(), $v.number()]")

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
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="2") {{ $t("revenu.totalTTC") }}
                v-col(cols="1")
              br
              TransitionGroup(name='slide-up')
                v-row(v-for='(quotation, index) in revenu.Quotations' :key="index")
                  v-col(cols="3")
                    v-text-field(v-model="quotation.company" :rules="[$v.required()]")
                  v-col(cols="2")
                    v-text-field(v-model="quotation.total" disabled)
                  v-col(cols="2")
                    v-text-field(v-model="quotation.totalTTC" disabled)
                  v-col(cols="1")
                    v-btn(icon="mdi-eye" variant="plain" size="small" :to="`/customers/${quotation.CustomerId}/invoices/${quotation.id}`")


            hr.my-8
            v-card-title.px-0.pb-8.text-h5 {{ $t("revenu.credits") }}
            template(v-if="credits.length")
              v-row
                v-col(cols="3") {{ $t("revenu.createdAt") }}
                v-col(cols="3") {{ $t("revenu.creditor") }}
                v-col(cols="3") {{ $t("revenu.category") }}
                v-col(cols="2") {{ $t("revenu.total") }}
                v-col(cols="1")
              br
              TransitionGroup(name='slide-up')
                v-row(v-for='(credit, index) in credits' :key="index")
                  v-col(cols="3")
                    DateInput(v-model="credit.createdAt")
                  v-col(cols="3")
                    v-text-field(v-model="credit.creditor" :rules="[$v.required()]")
                  v-col(cols="3")
                    v-select(v-model="credit.category" :items="creditCategories" @update:modelValue="updateTotal" )
                  v-col(cols="2")
                    NumberInput(v-model="credit.total" @change="(event) => updateTotal(index, event, 'Credits', 'total')" :rules="[$v.required(), $v.number()]")
                  v-col(cols="1")
                    v-btn(color="error" href='#' @click.prevent="removeItem(credit, 'Credit')")
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
              TransitionGroup(name='slide-up')
                v-row(v-for='(cost, index) in costs' :key="index" :class="{'bg-red-darken-4': cost.category === 'TODEFINE'}")
                  v-col(cols="1")
                    v-checkbox(v-model="cost.recurrent" color="secondary")
                  v-col(cols="2")
                    DateInput(v-model="cost.createdAt")
                  v-col(cols="3")
                    v-text-field(v-model="cost.name" :rules="[$v.required()]")
                  v-col(cols="2")
                    v-select(v-model="cost.category" :items="costCategories")
                  v-col(cols="1")
                    NumberInput(v-model="cost.tvaAmount" @change="(event) => updateTotal(index, event, 'Costs', 'tvaAmount')" :rules="[$v.number()]")
                  v-col(cols="2")
                    NumberInput(v-model="cost.total" @change="(event) => updateTotal(index, event, 'Costs', 'total')" :rules="[$v.required(), $v.number()]")
                  v-col(cols="1")
                    v-btn(color="error" href='#' @click.prevent="removeItem(cost, 'Cost')")
                      v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(@click.prevent="addItem('Cost')")
                  span {{ $t("revenu.addLine") }}

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
import type { Revenus, Costs, Credits, Invoices, Prisma } from "../../../types/models";
import { getRevenu, updateRevenu } from "../../utils/generated/api-user";
type RevenuWithCostsCredits = Revenus & { Costs: Costs[]; Credits: Credits[]; Invoices: Invoices[] };

const loadingStore = useLoadingStore();
const route = useRoute();
const router = useRouter();
const valid = ref(false);
const revenu = ref<RevenuWithCostsCredits>();
const costs = ref<Prisma.CostsUncheckedCreateInput[]>([]);
const credits = ref<Prisma.CreditsUncheckedCreateInput[]>([]);
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
const creditCategories = ["SALARY", "REFUND", "CRYPTO", "STOCK", "RENTAL", "TRANSFER"];
const creditItemTemplate = {
  total: 0,
  creditor: "",
  category: "SALARY",
  reason: "",
  RevenuId: 0,
};

const costChartData = ref();
const creditChartData = ref();
const chartOptions = {
  responsive: true,
};

const costItemTemplate: Prisma.CostsUncheckedCreateInput = {
  total: 0,
  name: "",
  category: "GENERAL",
  tvaAmount: 0,
  RevenuId: 0,
  recurrent: false,
};

onMounted(async () => {
  try {
    loadingStore.setLoading(true);
    revenu.value = await getRevenu(route.params.id, {
      BankId: route.query.bankId,
    });
    if (!revenu.value) return;
    revenu.value.watchers = revenu.value?.watchers?.length ? revenu.value?.watchers?.split(",") : [];
    costs.value = revenu.value.Costs;
    credits.value = revenu.value.Credits;
    creditItemTemplate.RevenuId = revenu.value?.id;
    costItemTemplate.RevenuId = revenu.value?.id;
    groupModelByCategory(costs, "costs", costCategories);
    groupModelByCategory(credits, "credits", creditCategories);
  } finally {
    loadingStore.setLoading(false);
  }
});

function addItem(itemName) {
  let createdAt;
  if (itemName === "Cost") {
    createdAt = costs.value.at(-1)?.createdAt || revenu.value?.createdAt;
    costs.value.push({ createdAt, ...costItemTemplate });
  } else {
    createdAt = credits.value.at(-1)?.createdAt || revenu.value?.createdAt;
    credits.value.push({ createdAt, ...creditItemTemplate });
  }
}

function removeItem(item, itemName) {
  if (itemName === "Cost") {
    const index = costs.value.findIndex((cost) => cost.id === item.id);
    costs.value.splice(index, 1);
    updateTotal();
  } else {
    const index = credits.value.findIndex((credit) => credit.id === item.id);
    credits.value.splice(index, 1);
    updateTotal();
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
  const totalPro = credits.value.filter((c) => c.category === "SALARY").reduce((sum, credit) => sum + +credit.total, 0);
  const totalPerso = credits.value
    .filter((c) => c.category !== "SALARY")
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
  return costs.value ? costs.value.map((cost) => cost.category) : [];
});

const computedCreditCategories = computed(() => {
  return credits.value ? credits.value.map((credit) => credit.category) : [];
});

function groupModelByCategory(model, model_name, items) {
  const groupedModel = model.value.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = {
        category: item.category,
        [`${model_name}`]: [],
      };
    }

    acc[item.category][`${model_name}`].push(item);
    return acc;
  }, {});

  const modelTotalByCategory = items.map((category) => {
    if (groupedModel[category]) {
      return groupedModel[category][`${model_name}`].reduce((sum, model) => sum + model.total, 0);
    } else {
      return 0;
    }
  });

  return model_name === "costs"
    ? (costChartData.value = {
        labels: items,
        datasets: [
          {
            data: modelTotalByCategory,
            backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20", "#FC2E20", "#FDB750", "#010100"],
          },
        ],
      })
    : (creditChartData.value = {
        labels: items,
        datasets: [
          {
            data: modelTotalByCategory,
            backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20"],
          },
        ],
      });
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
  return revenu.value?.Costs?.filter((c) => c.recurrent) || [];
});
</script>
