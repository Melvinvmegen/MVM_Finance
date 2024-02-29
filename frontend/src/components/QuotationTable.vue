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
        router-link(:to="`/customers/${route.params.customer_id}/quotations/new`")
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
        template( v-slot:[`item.created_at`]="{ item }")
          span {{ quotationDate(item.created_at) }}
        template( v-slot:[`item.caution_paid`]="{ item }")
          v-chip(:color="item.caution_paid ? 'success' : 'error'") {{ $t(`quotations.cautionPaidStatuses.${item.caution_paid}`)  }}
        template( v-slot:[`item.month`]="{ item }")
          span {{ revenuDate(item.revenu) }}
        template( v-slot:[`item.date`]="{ item }")
          span(v-if="item.payment_date") {{ dayjs(item.payment_date).format("DD/MM/YYYY") }}
        template( v-slot:[`item.total`]="{ item }")
          span {{ $n(item.total_ttc || item.total, "currency") }}
        template( v-slot:[`item.deposit`]="{ item }")
          span {{ $n((item.total_ttc || item.total) * 0.3, "currency") }}
        template( v-slot:[`item.tva_amount`]="{ item }")
          span {{ $n(item.tva_amount, "currency") }}
        template(v-slot:item.actions="{ item }")
          v-btn(variant="text" size="small" icon="mdi-cash" @click.stop="openQuotationModal = true; selectedQuotation = item" v-if='!item.caution_paid' )
          v-btn(variant="text" size="small" icon="mdi-receipt" @click.stop="download(item)")
          v-btn(variant="text" size="small" icon="mdi-email" @click.stop="openPendingModal(item)")
          v-btn(
            v-if="!item.caution_paid && !item.invoice_id"
            variant="text" size="small" 
            icon="mdi-pen"
            :to="`/customers/${route.params.customer_id}/quotations/${item.id}`"
          )
          v-btn(
            variant="text" 
            size="small" 
            icon="mdi-file-swap" 
            v-if="!item.invoice_id"
            @click.stop="convertToInvoice(item, $t('quotations.confirmConvert', [item.id]))"
          )
          v-btn(
            v-if="!item.caution_paid && !item.invoice_id"
            variant="text" size="small" 
            icon="mdi-delete"
            @click.stop="deleteItem(item, $t('quotations.confirmDelete', [item.id]))",
            :key="item.id"
          )

  v-dialog(v-model="openQuotationModal" width='800')
    PaymentForm(:model='selectedQuotation' @close="closePaymentForm")
v-dialog(v-model="open_pending_email_modal")
  PendingEmailForm(:model="selected_pending_email" @close="closePendingEmail")
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import {
  getQuotations,
  deleteQuotation,
  downloadQuotation,
  convertQuotationToInvoice,
} from "../utils/generated/api-user";

import type { revenu, quotation, Query, pending_email } from "../../types/models";

const loadingStore = useLoadingStore();
const { filterAll, items } = useFilter(getQuotations);
const { deleteItem } = useDelete(deleteQuotation);
const searchFrom = ref<HTMLFormElement | null>(null);
const selectedQuotation = ref(null);
const openQuotationModal = ref(false);
const selected_pending_email = ref(null);
const open_pending_email_modal = ref(false);
const valid = ref(false);
const { t: $t } = useI18n();
const query = ref<Query>({});
const route = useRoute();
const dataTable = {
  page: Number(route.query.currentPage) || 1,
  perPage: Number(route.query.perPage) || 12,
  sortBy: [],
  headers: [
    {
      key: "created_at",
      value: "created_at",
      title: $t("quotations.created_at"),
    },
    {
      key: "caution_paid",
      value: "caution_paid",
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
      key: "tva_amount",
      value: "tva_amount",
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
      customer_id: +route.params.customer_id,
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
    customer_id: +route.params.customer_id,
    force: true,
    currentPage: page,
    perPage: itemsPerPage,
    sortBy,
  });
  loadingStore.setLoading(false);
}

async function download(quotation: quotation) {
  loadingStore.setLoading(true);
  try {
    await downloadQuotation(quotation.customer_id, quotation.id);
    useMessageStore().i18nMessage("success", "quotations.downloaded");
  } finally {
    loadingStore.setLoading(false);
  }
}

function revenuDate(revenu: revenu) {
  if (!revenu) return;
  return dayjs(revenu.created_at).format("MMMM YYYY");
}

function quotationDate(created_at: string) {
  if (!created_at) return;
  return dayjs(created_at).format("DD/MM/YY");
}

async function resetAll() {
  searchFrom.value?.reset();
  query.value = {};
  await searchQuotations();
}

async function convertToInvoice(quotation: quotation, confirmString: string) {
  const result = confirm(confirmString);
  if (result) {
    loadingStore.setLoading(true);
    try {
      await convertQuotationToInvoice(quotation.customer_id, quotation.id);
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
  open_pending_email_modal.value = false;
  selected_pending_email.value = null;
  await searchQuotations();
}

function openPendingModal(quotation: quotation & { pending_emails: pending_email[]; customer: { email: string } }) {
  open_pending_email_modal.value = true;
  if (quotation.pending_emails?.length) {
    selected_pending_email.value = { ...quotation.pending_emails[0], quotation_id: quotation.id };
  } else {
    selected_pending_email.value = {
      recipient_email: quotation.customer.email,
      quotation_id: quotation.id,
      cron_task: { active: true },
    };
  }
}
</script>
