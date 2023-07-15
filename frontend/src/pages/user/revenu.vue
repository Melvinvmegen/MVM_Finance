<template lang="pug">
v-container
  v-row(v-if="revenu")
    v-col(cols='8')
      v-card
        v-form(@submit.prevent="handleSubmit")
          v-card-title.my-4
            .d-flex
              span {{ "Editer vos revenus de " + revenuMonth }}
              v-spacer 
              v-btn(icon="mdi-arrow-left" color="white" variant="outlined" @click='router.go(-1)')

          v-card-text
            v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
            v-row(dense)
              v-col(cols="2")
                v-text-field(name='taxPercentage' label='% Taxe' density="compact" v-model="revenu.taxPercentage" type='number' variant="outlined")

            div(v-if='revenu?.Invoices?.length')
              v-card-title Factures : 
              transition-group(name='slide-up')
                v-row(v-for='invoice in revenu.Invoices' :key="invoice.id")
                  v-col(cols="3")
                    v-text-field(label='name' density="compact" :model-value="invoice.company || invoice.lastName" disabled variant="outlined")
                  v-col(cols="2")
                    v-text-field(label='Total' density="compact" :model-value="invoice.total" disabled variant="outlined")

            div(v-if='revenu.Quotations?.length')
              v-card-title Devis :
              transition-group(name='slide-up')
                v-row(v-for='quotation in revenu.Quotations' :key="quotation.id")
                  v-col(cols="3")
                    v-text-field(label='name' density="compact" v-model="quotation.company" type='text' variant="outlined")
                  v-col(cols="2")
                    v-text-field(label='Total' density="compact" v-model="quotation.total" :disabled='true' type='number' variant="outlined")

            hr.my-8
            v-card-title Credits :
            transition-group(name='slide-up')
              v-row(v-for='(credit, index) in credits' :key="credit.id || index")
                v-col(cols="2")
                    //- TODO: replace datepicker with vuetify's 
                    Datepicker(
                      name="createdAt",
                      v-model="credit.createdAt",
                      format="dd/MM/yyyy"
                      dark
                      position="center"
                      :month-change-on-scroll="false"
                      auto-apply
                    )
                v-col(cols="3")
                  v-text-field(label='creditor' density="compact" v-model="credit.creditor" type='text' variant="outlined")
                v-col(cols="2")
                  v-select(label='Category' density="compact" v-model="credit.category" :items="creditCategories" @update:modelValue="updateTotal(credit)" variant="outlined")
                v-col(cols="2")
                  v-text-field(label='Total' density="compact" v-model.number="credit.total" @change="updateTotal(credit)" type='number' variant="outlined")
                v-col(cols="1")
                  v-btn(color="error" href='#' @click.prevent="removeItem(credit, 'Credit')")
                    v-icon mdi-delete

              v-row
                v-col(cols="12" justify="end")
                  v-btn(color="secondary" @click.prevent="addItem('Credit')")
                    span + Ajouter une ligne

            hr.my-8
            v-card-title Coûts :
            v-spacer
            v-autocomplete(
              chips
              label="Autocomplete"
              :items="costsNames"
              v-model="revenu.watchers"
              multiple)
            transition-group(name='slide-up')
              v-row(v-for='(cost, index) in costs' :key="cost.id || index" :class="{'bg-red-darken-4': cost.category === 'TODEFINE'}")
                v-col(cols="1")
                  v-checkbox(v-model="cost.recurrent" color="secondary")
                v-col(cols="2")
                  Datepicker(
                    name="createdAt",
                    v-model="cost.createdAt",
                    format="dd/MM/yyyy"
                    dark
                    position="center"
                    :month-change-on-scroll="false"
                    auto-apply
                  )
                v-col(cols="3")
                  v-text-field(label='Référence' density="compact" v-model="cost.name" type='text' variant="outlined")
                v-col(cols="2")
                  v-select(label='Category' density="compact" v-model="cost.category" :items="costCategories" variant="outlined")
                v-col(cols="1")
                  v-text-field(label='TVA' density="compact" v-model.number="cost.tvaAmount" @change="updateTotal(cost)" type='number' variant="outlined")
                v-col(cols="2")
                  v-text-field(label='Total' density="compact" v-model.number="cost.total" @change="updateTotal(cost)" type='number' variant="outlined")
                v-col(cols="1")
                  v-btn(color="error" href='#' @click.prevent="removeItem(cost, 'Cost')")
                    v-icon mdi-delete

              v-row
                v-col(cols="12" justify="end")
                  v-btn(color="secondary" @click.prevent="addItem('Cost')")
                    span + Ajouter une ligne

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
          v-card-title Revenus : {{ revenu.total }} €
          Pie(v-if="creditChartData" :chart-data='creditChartData' :chart-options='chartOptions')
          v-card-title Costs : {{ revenu.expense }} €
          Pie(v-if="costChartData" :chart-data='costChartData' :chart-options='chartOptions')
          hr.mx-2.my-4
          v-card-title Watchers :
          v-row(align="center" class="ml-1 mt-1" v-for='watcher in splitedWatchers' closable-chips :key="watcher")
            v-card-subtitle - {{ watcher }}
            v-card-title {{ revenu.Costs.filter((c) => c.name.includes(watcher)).reduce((sum, c) => sum + c.total, 0) }} €
</template>

<script setup lang="ts">
import type { Revenus, Costs, Credits, Invoices } from "../../../types/models";
type RevenuWithCostsCredits = Revenus & { Costs: Costs[]; Credits: Credits[]; Invoices: Invoices[] };

const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
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

indexStore.setLoading(true);
revenuStore.getRevenu(route.query.bankId, route.params.id).then((data) => {
  revenu.value = data;
  if (!revenu.value) return;
  revenu.value.watchers = data?.watchers?.split(",");
  costs.value = data.Costs;
  credits.value = data.Credits;
  creditItemTemplate.RevenuId = revenu.value?.id;
  costItemTemplate.RevenuId = revenu.value?.id;
  groupModelByCategory(costs, "costs", costCategories);
  groupModelByCategory(credits, "credits", creditCategories);

  indexStore.setLoading(false);
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
  indexStore.setLoading(true);

  try {
    const res = await revenuStore.updateRevenu(revenu.value);
    if (res && res.id) {
      router.push(`/revenus`);
    }
  } finally {
    indexStore.setLoading(false);
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
