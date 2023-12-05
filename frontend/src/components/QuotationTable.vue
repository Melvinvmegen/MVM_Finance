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
    v-form(v-model="valid" @submit.prevent ref="searchFrom")
      v-row
        v-col.mr-2(cols="12" sm="5" md="4" lg="3")
          NumberInput(hide-details :label='$t("quotations.searchByTotal")' name='by_total' v-model='query.total' @blur='searchQuotations' :rules="[$v.number()]")

        v-row(align="center")
          v-btn.bg-secondary(@click='searchQuotations') {{ $t("quotations.search") }}
          v-icon.ml-2(@click="resetAll()") mdi-restore

    v-col(cols="12")
      v-data-table-server(
        :headers="dataTable.headers"
        :items-length="items?.count"
        :items="items?.rows"
        :items-per-page="dataTable.perPage"
        :loading="loadingStore.loading"
        @update:options="getQuotationsData"
        item-value="name"
        )
        template( v-slot:[`item.cautionPaid`]="{ item }")
          v-chip(:color="item.cautionPaid ? 'success' : 'error'") {{ $t(`quotations.cautionPaidStatuses.${item.cautionPaid}`)  }}
        template( v-slot:[`item.month`]="{ item }")
          span {{ revenuDate(item.Revenus) }}
        template( v-slot:[`item.date`]="{ item }")
          span(v-if="item.paymentDate") {{ dayjs(item.paymentDate).format("DD/MM/YYYY") }}
        template( v-slot:[`item.total`]="{ item }")
          span {{ $n(item.totalTTC || item.total, "currency") }}
        template( v-slot:[`item.deposit`]="{ item }")
          span {{ $n((item.totalTTC || item.total) * 0.3, "currency") }}
        template( v-slot:[`item.tvaAmount`]="{ item }")
          span {{ $n(item.tvaAmount, "currency") }}
        template(v-slot:item.actions="{ item }")
          v-btn(variant="text" size="small" icon="mdi-cash" @click.stop="openQuotationModal = true; selectedQuotation = item" v-if='!item.cautionPaid' )
          v-btn(variant="text" size="small" icon="mdi-receipt" @click.stop="download(item)")
          v-btn(variant="text" size="small" icon="mdi-email" @click.stop="openPendingModal(item)")
          v-btn(
            v-if="!item.cautionPaid && !item.InvoiceId"
            variant="text" size="small" 
            icon="mdi-pen"
            :to="`/customers/${route.params.customerId}/quotations/${item.id}`"
          )
          v-btn(
            variant="text" 
            size="small" 
            icon="mdi-file-swap" 
            v-if="!item.InvoiceId"
            @click.stop="convertToInvoice(item, $t('quotations.confirmConvert', [item.id]))"
          )
          v-btn(
            v-if="!item.cautionPaid && !item.InvoiceId"
            variant="text" size="small" 
            icon="mdi-delete"
            @click.stop="deleteItem(item, $t('quotations.confirmDelete', [item.id]))",
            :key="item.id"
          )

  v-dialog(v-model="openQuotationModal" width='800')
    PaymentForm(:model='selectedQuotation' @close="closePaymentForm")
v-dialog(v-model="openPendingEmailModal")
  PendingEmailForm(:model="selectedPendingEmail" @close="closePendingEmail")
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import {
  getQuotations,
  deleteQuotation,
  downloadQuotation,
  convertQuotationToInvoice,
} from "../utils/generated/api-user";

import type { Revenus, Quotations, Query, PendingEmail } from "../../types/models";

const loadingStore = useLoadingStore();
const { filterAll, items } = useFilter(getQuotations);
const { deleteItem } = useDelete(deleteQuotation);
const searchFrom = ref<HTMLFormElement | null>(null);
const selectedQuotation = ref(null);
const openQuotationModal = ref(false);
const selectedPendingEmail = ref(null);
const openPendingEmailModal = ref(false);
const valid = ref(false);
const { t: $t } = useI18n();
const query = ref<Query>({});
const route = useRoute();
const dataTable = {
  perPage: 12,
  headers: [
    {
      key: "cautionPaid",
      value: "cautionPaid",
      title: $t("quotations.caution"),
    },
    {
      key: "month",
      value: "month",
      title: $t("quotations.revenu"),
      sortable: false,
    },
    {
      key: "date",
      value: "date",
      title: $t("quotations.paymentDate"),
    },
    {
      key: "total",
      value: "total",
      title: $t("quotations.total"),
    },
    {
      key: "deposit",
      value: "deposit",
      title: $t("quotations.deposit"),
    },
    {
      key: "tvaAmount",
      value: "tvaAmount",
      title: $t("quotations.tvaAmount"),
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

async function searchQuotations() {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  try {
    await filterAll({
      CustomerId: +route.params.customerId,
      ...query.value,
      force: true,
    });
  } catch (err) {
    console.error(err);
  } finally {
    loadingStore.setLoading(false);
  }
}

async function getQuotationsData({ page, itemsPerPage, sortBy }) {
  loadingStore.setLoading(true);
  await filterAll({
    CustomerId: +route.params.customerId,
    force: true,
    currentPage: page,
    perPage: itemsPerPage,
    sortBy,
  });
  loadingStore.setLoading(false);
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

function revenuDate(revenu: Revenus) {
  if (!revenu) return;
  return dayjs(revenu.createdAt).format("MMMM YYYY");
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

async function closePaymentForm() {
  openQuotationModal.value = false;
  selectedQuotation.value = null;
  await searchQuotations();
}

async function closePendingEmail() {
  openPendingEmailModal.value = false;
  selectedPendingEmail.value = null;
  await searchQuotations();
}

function openPendingModal(quotation: Quotations & { PendingEmails: PendingEmail[]; Customers: { email: string } }) {
  openPendingEmailModal.value = true;
  if (quotation.PendingEmails?.length) {
    selectedPendingEmail.value = { ...quotation.PendingEmails[0], QuotationId: quotation.id };
  } else {
    selectedPendingEmail.value = {
      recipientEmail: quotation.Customers.email,
      QuotationId: quotation.id,
      CronTask: { active: true },
    };
  }
}
</script>
