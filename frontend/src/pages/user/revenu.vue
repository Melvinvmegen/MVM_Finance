<template lang="pug">
v-container
  v-row(v-if="revenu")
    v-col(cols='9')
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
                    v-text-field(label='name' density="compact" v-model="invoice.company" type='text' variant="outlined")
                  v-col(cols="2")
                    v-text-field(label='Total' density="compact" v-model="invoice.total" :disabled='true' type='number' variant="outlined")

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
                v-col(cols="3")
                  v-text-field(label='creditor' density="compact" v-model="credit.creditor" type='text' variant="outlined")
                v-col(cols="3")
                  v-text-field(label='Raison' density="compact" v-model="credit.reason" type='text' variant="outlined")
                v-col(cols="3")
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
            transition-group(name='slide-up')
              v-row(v-for='(cost, index) in costs' :key="cost.id || index")
                v-col(cols="3")
                  v-text-field(label='Référence' density="compact" v-model="cost.name" type='text' variant="outlined")
                v-col(cols="3")
                  v-text-field(label='Montant TVA' density="compact" v-model.number="cost.tvaAmount" @change="updateTotal(cost)" type='number' variant="outlined")
                v-col(cols="3")
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
                v-btn.bg-secondary.text-white(type="submit") {{ "Editer un revenu" }}
    v-col(cols='3')
      total-field(
        :initial-total='revenu.total',
        :parent='revenu'
      )
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, onUnmounted } from "vue";
import { storeToRefs } from "pinia";
import type Revenu from "../types/Revenu";
import type Cost from "../types/Cost";
import type Credit from "../types/Credit";
import type Customer from "../types/Customer";
import type Invoice from "../types/Invoice";
import type Quotation from "../types/Quotation";
import { useRouter } from "vue-router";
import TotalField from "../../components/general/totalField.vue";
import { useRoute } from "vue-router";
import { useIndexStore } from "../../store/indexStore.ts";
import { useRevenuStore } from "../../store/revenuStore.ts";

const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
const route = useRoute();
const router = useRouter();
const revenu = shallowRef<Revenu | null>({});
const costs = ref<Cost[] | null>(null);
const credits = ref<Credit[] | null>(null);
const creditItemTemplate = {
  total: 0,
  creditor: "",
  reason: "",
  RevenuId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const costItemTemplate = {
  total: 0,
  name: "",
  tvaAmount: 0,
  RevenuId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

indexStore.setLoading(true);
revenuStore.getRevenu(route.params.id).then((data) => {
  revenu.value = data;
  costs.value = data.Costs;
  credits.value = data.Credits;
  creditItemTemplate.RevenuId = revenu.value.id;
  costItemTemplate.RevenuId = revenu.value.id;
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
  const tvaCollected = revenu.value.Invoices.reduce((sum, invoice) => sum + +invoice.tvaAmount, 0);
  const tvaDispatched = costs.value.reduce((sum, cost) => sum + +cost.tvaAmount, 0);
  const totalInvoices = revenu.value.Invoices.reduce((sum, invoice) => sum + +invoice.total, 0);
  const totalPro = credits.value.filter((c) => !c.refund).reduce((sum, credit) => sum + +credit.total, 0);
  const totalRefunds = credits.value.filter((c) => c.refund).reduce((sum, credit) => sum + +credit.total, 0);
  const totalCosts = costs.value.reduce((sum, cost) => sum + +cost.total, 0);

  revenu.value.tva_dispatched = tvaDispatched;
  revenu.value.tva_collected = tvaCollected;
  revenu.value.expense = totalCosts;
  revenu.value.pro = totalInvoices + totalPro;
  revenu.value.perso = totalRefunds;
  revenu.value.refund = totalRefunds;
  revenu.value.total = totalInvoices + totalPro + totalRefunds;
}

async function handleSubmit() {
  indexStore.setLoading(true);

  try {
    const res = await revenuStore.updateRevenu(revenu.value);
    if (res && res.id) {
      router.push({ path: `/customers` });
    }
  } finally {
    indexStore.setLoading(false);
  }
}

const revenuMonth = computed(() => {
  const date = new Date(revenu.value.createdAt);
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
});

onUnmounted(() => {
  revenu.value = null;
  costs.value = null;
  credits.value = null;
})
</script>
