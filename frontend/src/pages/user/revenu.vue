<template lang="pug">
v-container
  v-row(v-if="revenu")
    v-col(cols='8')
      v-card
        v-form(@submit.prevent="handleSubmit")
          v-card-title.my-4
            .d-flex
              span {{ $t("revenu.editRevenu", [revenuMonth])  }}
              v-spacer 
              v-btn(icon="mdi-arrow-left" color="white"  @click='router.go(-1)')

          v-card-text
            v-row(dense)
              v-col(cols="2")
                v-text-field(name='taxPercentage' :label='$t("revenu.tax")'  v-model="revenu.taxPercentage" :rules="[$v.required(), $v.number()]")

            div(v-if='revenu?.Invoices?.length')
              v-card-title {{ $t("revenu.invoices") }} 
              transition-group(name='slide-up')
                v-row(v-for='invoice in revenu.Invoices' :key="invoice.id")
                  v-col(cols="3")
                    v-text-field(:label='$t("revenu.name")' :model-value="invoice.company || invoice.lastName" disabled)
                  v-col(cols="2")
                    v-text-field(:label='$t("revenu.total")' :model-value="invoice.total" disabled)

            div(v-if='revenu.Quotations?.length')
              v-card-title {{ $t("revenu.quotations") }}
              transition-group(name='slide-up')
                v-row(v-for='quotation in revenu.Quotations' :key="quotation.id")
                  v-col(cols="3")
                    v-text-field(:label='$t("revenu.name")' v-model="quotation.company" :rules="[$v.required()]")
                  v-col(cols="2")
                    v-text-field(:label='$t("revenu.total")' v-model="quotation.total" :disabled='true'  )

            hr.my-8
            v-card-title {{ $t("revenu.credits") }}
            transition-group(name='slide-up')
              v-row(v-for='(credit, index) in credits' :key="credit.id || index")
                v-col(cols="2")
                  DateInput(:value="credit.createdAt")
                v-col(cols="3")
                  v-text-field(:label='$t("revenu.creditor")' v-model="credit.creditor" :rules="[$v.required()]")
                v-col(cols="2")
                  v-select(:label='$t("revenu.category")' v-model="credit.category" :items="creditCategories" @update:modelValue="updateTotal(credit)" )
                v-col(cols="2")
                  v-text-field(:label='$t("revenu.total")' v-model.number="credit.total" @change="updateTotal(credit)" :rules="[$v.required(), $v.number()]")
                v-col(cols="1")
                  v-btn(color="error" href='#' @click.prevent="removeItem(credit, 'Credit')")
                    v-icon mdi-delete

              v-row
                v-col(cols="12" justify="end")
                  v-btn(color="secondary" @click.prevent="addItem('Credit')")
                    span {{ $t("revenu.addLine") }}

            hr.my-8
            v-card-title {{ $t("revenu.costs") }}
            v-spacer
            v-autocomplete(
              chips
              :label='$t("revenu.watchers")'
              :items="costsNames"
              v-model="revenu.watchers"
              multiple)
            transition-group(name='slide-up')
              v-row(v-for='(cost, index) in costs' :key="cost.id || index" :class="{'bg-red-darken-4': cost.category === 'TODEFINE'}")
                v-col(cols="1")
                  v-checkbox(v-model="cost.recurrent" color="secondary")
                v-col(cols="2")
                  DateInput(:value="cost.createdAt")
                v-col(cols="3")
                  v-text-field(:label='$t("revenu.reference")' v-model="cost.name" :rules="[$v.required()]")
                v-col(cols="2")
                  v-select(:label='$t("revenu.category")' v-model="cost.category" :items="costCategories")
                v-col(cols="1")
                  v-text-field(:label='$t("revenu.vat")' v-model.number="cost.tvaAmount" @change="updateTotal(cost)" :rules="[$v.required(), $v.number()]")
                v-col(cols="2")
                  v-text-field(:label='$t("revenu.total")' v-model.number="cost.total" @change="updateTotal(cost)" :rules="[$v.required(), $v.number()]")
                v-col(cols="1")
                  v-btn(color="error" href='#' @click.prevent="removeItem(cost, 'Cost')")
                    v-icon mdi-delete

              v-row
                v-col(cols="12" justify="end")
                  v-btn(color="secondary" @click.prevent="addItem('Cost')")
                    span {{ $t("revenu.addLine") }}

          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn.bg-primary.text-white(@click='router.go(-1)') {{ "Retour" }}
                v-btn.bg-secondary.text-white(type="submit") {{ "Editer un revenu" }}
    v-col(cols='4')
      v-card
        v-card-text
          TotalField(
            :initial-total='revenu.total',
            :model='revenu'
          )
        v-card-text
          v-card-title {{ $t("revenu.revenus") }} {{ revenu.total }} €
          PieChart(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')
          v-card-title {{ $t("revenu.costs") }} {{ revenu.expense }} €
          PieChart(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
          hr.mx-2.my-4
          v-card-title {{ $t("revenu.watchers") }}
          v-row(align="center" class="ml-1 mt-1" v-for='watcher in splitedWatchers' closable-chips :key="watcher")
            v-card-subtitle - {{ watcher }}
            v-card-title {{ revenu.Costs.filter((c) => c.name.includes(watcher)).reduce((sum, c) => sum + c.total, 0) }} €
</template>

<script setup lang="ts">
import type { Revenus, Costs, Credits, Invoices } from "../../../types/models";
import { getRevenu, updateRevenu } from "../../utils/generated/api-user";
type RevenuWithCostsCredits = Revenus & { Costs: Costs[]; Credits: Credits[]; Invoices: Invoices[] };

const loadingStore = useLoadingStore();
const route = useRoute();
const router = useRouter();
const revenu = ref<RevenuWithCostsCredits | null>(null);
const costs = ref<Costs[]>([]);
const credits = ref<Credits[]>([]);
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
  id: 0,
  total: 0,
  creditor: "SALARY",
  reason: "",
  RevenuId: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const costChartData = ref(null);
const creditChartData = ref(null);
const chartOptions = {
  responsive: true,
};

const costItemTemplate = {
  id: 0,
  total: 0,
  name: "",
  category: "GENERAL",
  tvaAmount: 0,
  RevenuId: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  recurrent: false,
};

loadingStore.setLoading(true);
getRevenu(route.query.bankId, route.params.id).then((data) => {
  revenu.value = data;
  if (!revenu.value) return;
  revenu.value.watchers = data?.watchers?.split(",");
  costs.value = data.Costs;
  credits.value = data.Credits;
  creditItemTemplate.RevenuId = revenu.value?.id;
  costItemTemplate.RevenuId = revenu.value?.id;
  groupModelByCategory(costs, "costs", costCategories);
  groupModelByCategory(credits, "credits", creditCategories);

  loadingStore.setLoading(false);
});

function addItem(itemName) {
  if (itemName === "Cost") {
    costs.value.push({ ...costItemTemplate });
  } else {
    credits.value.push({ ...creditItemTemplate });
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

function updateTotal() {
  if (!revenu.value) return;
  const tvaCollected = revenu.value.Invoices.reduce((sum, invoice) => sum + +invoice.tvaAmount, 0);
  const tvaDispatched = costs.value.reduce((sum, cost) => sum + Number(cost.tvaAmount), 0);
  const totalInvoices = revenu.value.Invoices.reduce((sum, invoice) => sum + +invoice.total, 0);
  const totalPro = credits.value.filter((c) => c.category !== "REFUND").reduce((sum, credit) => sum + +credit.total, 0);
  const totalRefunds = credits.value
    .filter((c) => c.category === "REFUND")
    .reduce((sum, credit) => sum + +credit.total, 0);
  const totalCosts = costs.value.reduce((sum, cost) => sum + Number(cost.total), 0);

  revenu.value.tva_dispatched = tvaDispatched;
  revenu.value.tva_collected = tvaCollected;
  revenu.value.expense = totalCosts;
  revenu.value.pro = totalInvoices + totalPro;
  revenu.value.perso = totalRefunds;
  revenu.value.total = totalInvoices + totalPro + totalRefunds;
}

async function handleSubmit() {
  loadingStore.setLoading(true);

  try {
    const res = await updateRevenu(revenu.value);
    if (res && res.id) {
      router.push(`/revenus`);
    }
  } finally {
    loadingStore.setLoading(false);
  }
}

const revenuMonth = computed(() => {
  if (!revenu.value) return;
  const date = new Date(revenu.value.createdAt);
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
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

const costsNames = computed(() => {
  const arr = costs.value ? costs.value.map((cost) => cost.name.replace(/[\d+/+]/g, "").trim()) : [];

  return [...new Set(arr)];
});

const splitedWatchers = computed(() => {
  if (!revenu.value) return;
  let watchers = revenu.value.watchers || [];
  if (!!watchers && typeof watchers === "object") {
    return (watchers = Object.entries(watchers).map((i) => i[1]));
  } else if (!!watchers && typeof watchers === "string") {
    return watchers.split(",");
  } else {
    return [];
  }
});
</script>
