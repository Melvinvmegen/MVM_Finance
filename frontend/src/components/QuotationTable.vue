<template lang="pug">
v-card.pa-4(elevation="3")
  v-card-title
    v-row(justify="space-between" align="center")
      v-col(cols="11")
        v-row(align="center")
          v-btn(icon="mdi-arrow-left" variant="text" to='/customers')
          .text-uppercase {{ $t("quotations.title") }}

      v-spacer  
      v-col(cols="1")
        router-link(:to="`/customers/${route.params.customerId}/quotations/new`")
          v-btn(icon="mdi-plus" color="primary")

  v-card-text
    v-form(@submit.prevent ref="searchFrom")
      v-row
        v-col.mr-2(cols="12" sm="5" md="4" lg="3")
          v-text-field(hide-details :label='$t("quotations.searchByTotal")' name='by_total' v-model='query.total' @blur='searchQuotations')

        v-row(align="center")
          v-btn.bg-secondary(@click='searchQuotations') {{ $t("quotations.search") }}
          v-icon.ml-2(@click="resetAll()") mdi-restore

    v-col(cols="12")
      v-data-table-server.elevation-1(
        :headers="dataTable.headers"
        :items-length="items?.count"
        :items="items?.rows"
        :items-per-page="dataTable.perPage"
        :loading="loadingStore.loading"
        @update:options="getQuotationsData"
        item-value="name"
        )
        template( v-slot:[`item.month`]="{ item }")
          span {{ revenuDate(item.raw.Revenus) }}
        template( v-slot:[`item.totalTTC`]="{ item }")
          span {{ $n(item.raw.totalTTC, "currency") }}
        template( v-slot:[`item.caution`]="{ item }")
          span {{ $n(item.raw.total * 0.3, "currency") }}
        template( v-slot:[`item.tvaAmount`]="{ item }")
          span {{ $n(item.raw.tvaAmount, "currency") }}
        template( v-slot:[`item.cautionPaid`]="{ item }")
          span {{ $t(`quotations.cautionPaidStatuses.${item.raw.cautionPaid}`)  }}
        template(v-slot:item.actions="{ item }")
          v-btn(variant="text" size="small" icon="mdi-cash" @click.stop="openQuotationModel = true; selectedQuotation = item.raw" v-if='!item.raw.cautionPaid' )
          v-btn(variant="text" size="small" icon="mdi-receipt" @click.stop="download(item.raw)")
          v-btn(variant="text" size="small" icon="mdi-email" @click.stop="sendEmail(item.raw)")
          v-btn(
            v-if="!item.raw.cautionPaid && !item.raw.InvoiceId"
            variant="text" size="small" 
            icon="mdi-pen"
            :to="`/customers/${route.params.customerId}/quotations/${item.raw.id}`"
          )
          v-btn(
            variant="text" 
            size="small" 
            icon="mdi-file-swap" 
            v-if="!item.raw.InvoiceId"
            @click.stop="convertToInvoice(item.raw, $t('quotations.confirmConvert', [item.raw.id]))"
          )
          v-btn(
            v-if="!item.raw.cautionPaid && !item.raw.InvoiceId"
            variant="text" size="small" 
            icon="mdi-delete"
            @click.stop="deleteItem(item.raw, $t('quotations.confirmDelete', [item.raw.id]))",
            :key="item.raw.id"
          )

  v-dialog(v-model="openQuotationModel" width='800')
    payment-form(:model='selectedQuotation' @close="closePaymentForm")
</template>

<script setup lang="ts">
import {
  getQuotations,
  deleteQuotation,
  downloadQuotation,
  convertQuotationToInvoice,
  sendQuotation,
} from "../utils/generated/api-user";

import type { Revenus, Quotations, Query } from "../../types/models";

const loadingStore = useLoadingStore();
const { filterAll, items } = useFilter(getQuotations);
const { deleteItem } = useDelete(deleteQuotation);
const searchFrom = ref<HTMLFormElement | null>(null);
const selectedQuotation = ref(null);
const openQuotationModel = ref(false);
const { t: $t } = useI18n();
const query = ref<Query>({});
const route = useRoute();
const dataTable = {
  perPage: 12,
  headers: [
    {
      key: "month",
      value: "month",
      title: $t("quotations.revenu"),
      sortable: false,
    },
    {
      key: "totalTTC",
      value: "totalTTC",
      title: $t("quotations.total"),
    },
    {
      key: "caution",
      value: "caution",
      title: $t("quotations.caution"),
      sortable: false,
    },
    {
      key: "tvaAmount",
      value: "tvaAmount",
      title: $t("quotations.tvaAmount"),
    },
    {
      key: "cautionPaid",
      value: "cautionPaid",
      title: $t("quotations.cautionPaid"),
    },
    {
      key: "actions",
      value: "actions",
      title: "",
      sortable: false,
      width: 250,
    },
  ],
};

onMounted(async () => {
  await filterAll({
    CustomerId: +route.params.customerId,
  });
});

async function searchQuotations() {
  await filterAll({
    CustomerId: +route.params.customerId,
    ...query.value,
    force: true,
  });
}

async function getQuotationsData({ page, itemsPerPage, sortBy }) {
  await filterAll({
    CustomerId: +route.params.customerId,
    force: true,
    currentPage: page,
    perPage: itemsPerPage,
    sortBy,
  });
}

async function download(quotation: Quotations) {
  loadingStore.setLoading(true);
  try {
    await downloadQuotation(quotation.CustomerId, quotation.id);
    useMessageStore().i18nMessage("success", "quotations.downloaded");
  } finally {
    loadingStore.setLoading(false);
  }
}

async function sendEmail(quotation: Quotations) {
  loadingStore.setLoading(true);
  try {
    await sendQuotation(quotation.CustomerId, quotation.id);
    useMessageStore().i18nMessage("success", "quotations.emailSent");
  } finally {
    loadingStore.setLoading(false);
  }
}

function revenuDate(revenu: Revenus) {
  if (!revenu) return;
  const date = new Date(revenu.createdAt);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

async function closePaymentForm() {
  openQuotationModel.value = false;
  selectedQuotation.value = null;
  await searchQuotations();
}

async function resetAll() {
  searchFrom.value?.reset();
  query.value = {};
  await searchQuotations();
}

async function convertToInvoice(quotation: Quotations, confirmString: string) {
  const result = confirm(confirmString);
  if (result) {
    loadingStore.setLoading(true);
    try {
      await convertQuotationToInvoice(quotation.CustomerId, quotation.id);
      useMessageStore().i18nMessage("success", "quotations.convertedToInvoice");
      window.location.reload();
    } finally {
      loadingStore.setLoading(false);
    }
  }
}
</script>
