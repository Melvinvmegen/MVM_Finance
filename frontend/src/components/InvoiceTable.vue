<template lang="pug">
v-card.pa-4(elevation="3")
  v-card-title
    v-row(justify="space-between" align="center")
      v-col(cols="11")
        v-row(align="center")
          v-btn(icon="mdi-arrow-left" variant="text" to='/customers')
          .text-uppercase {{ $t("invoices.title") }}

      v-spacer  
      v-col(cols="1")
        router-link(:to="`/customers/${route.params.customer_id}/invoices/new`")
          v-btn(icon="mdi-plus" color="primary")

  v-card-text
    v-form(v-model="valid" @submit.prevent ref="searchFrom")
      v-row
        v-col.mr-2(cols="12" sm="5" md="4" lg="3")
          NumberInput(hide-details :label='$t("invoice.searchByTotal")' name='by_total' v-model='query.total_ttc' @blur='searchInvoices' :rules="[$v.number()]")

        v-row(align="center")
          v-btn.bg-secondary(@click='searchInvoices') {{ $t("invoices.search") }}
          v-icon.ml-2(@click="resetAll") mdi-restore

    v-col(cols="12")
      v-data-table-server(
        :headers="dataTable.headers"
        :items-length="items?.count"
        :items="items?.rows"
        :items-per-page="dataTable.perPage"
        :loading="loadingStore.loading"
        @update:options="getInvoicesData"
        item-value="name"
        )
        template( v-slot:[`item.created_at`]="{ item }")
          span {{ invoiceDate(item.created_at) }}
        template( v-slot:[`item.paid`]="{ item }")
          v-chip(:color="item.paid ? 'success' : 'error'") {{ $t(`invoices.paidStatus.${item.paid}`)  }}
        template( v-slot:[`item.month`]="{ item }")
          span {{ revenuDate(item.revenu) }}
        template( v-slot:[`item.date`]="{ item }")
          span(v-if="item.payment_date") {{ dayjs(item.payment_date).format("DD/MM/YYYY") }}
        template( v-slot:[`item.total`]="{ item }")
          span {{ $n(item.total_ttc, "currency") }}
        template( v-slot:[`item.tva_amount`]="{ item }")
          span {{ $n(item.tva_amount, "currency") }}
        template(v-slot:item.actions="{ item }")
          v-btn(variant="text" size="small" icon="mdi-cash" @click.stop="openInvoiceModal = true; selectedInvoice = item")
          v-btn(variant="text" size="small" icon="mdi-receipt" @click.stop="download(item)")
          v-btn(variant="text" size="small" icon="mdi-email" @click.stop="openPendingModal(item)")
          v-btn(
            v-if="!item.paid"
            variant="text" size="small" 
            icon="mdi-pen"
            :to="`/customers/${route.params.customer_id}/invoices/${item.id}`"
          )
          v-btn(
            v-if="!item.paid"
            variant="text" size="small" 
            icon="mdi-delete"
            @click.stop="deleteItem(item, $t('invoices.confirmDelete', [item.id]))",
          )

v-dialog(v-model="openInvoiceModal")
  PaymentForm(:model='selectedInvoice' @close="closePaymentForm")
v-dialog(v-model="open_pending_email")
  PendingEmailForm(:model="selected_pending_email" @close="closePendingEmail")
</template>

<script setup lang="ts">
import { getInvoices, deleteInvoice, downloadInvoice } from "../utils/generated/api-user";
import type { revenu, invoice, Query, pending_email } from "../../types/models";
import dayjs from "dayjs";

const loadingStore = useLoadingStore();
const { filterAll, items } = useFilter(getInvoices);
const { deleteItem } = useDelete(deleteInvoice);
const searchFrom = ref<HTMLFormElement | null>(null);
const selectedInvoice = ref(null);
const openInvoiceModal = ref(false);
const selected_pending_email = ref(null);
const open_pending_email = ref(false);
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
      title: $t("invoices.created_at"),
    },
    {
      key: "paid",
      value: "paid",
      title: $t("invoices.paid"),
    },
    {
      key: "month",
      value: "month",
      title: $t("invoices.revenu"),
      sortable: false,
    },
    {
      key: "date",
      value: "date",
      title: $t("invoices.paymentDate"),
    },
    {
      key: "total",
      value: "total",
      title: $t("invoices.total"),
    },
    {
      key: "tva_amount",
      value: "tva_amount",
      title: $t("invoices.vatAmount"),
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

async function searchInvoices() {
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

async function getInvoicesData({ page, itemsPerPage, sortBy }) {
  loadingStore.setLoading(true);

  await filterAll({
    customer_id: +route.params.customer_id,
    force: !!items.value.count,
    currentPage: page,
    perPage: itemsPerPage,
    sortBy,
  });
  loadingStore.setLoading(false);
}

async function download(invoice: invoice) {
  loadingStore.setLoading(true);
  try {
    await downloadInvoice(invoice.customer_id, invoice.id);
    useMessageStore().i18nMessage("success", "invoices.downloaded");
  } finally {
    loadingStore.setLoading(false);
  }
}

async function resetAll() {
  searchFrom.value?.reset();
  query.value = {};
  await searchInvoices();
}

function revenuDate(revenu: revenu) {
  if (!revenu) return;
  return dayjs(revenu.created_at).format("MMMM YYYY");
}

function invoiceDate(created_at: string) {
  if (!created_at) return;
  return dayjs(created_at).format("DD/MM/YY");
}

async function closePaymentForm() {
  openInvoiceModal.value = false;
  selectedInvoice.value = null;
  await searchInvoices();
}

async function closePendingEmail() {
  open_pending_email.value = false;
  selected_pending_email.value = null;
  await searchInvoices();
}

function openPendingModal(invoice: invoice & { pending_emails: pending_email[]; customer: { email: string } }) {
  open_pending_email.value = true;
  if (invoice.pending_emails?.length) {
    selected_pending_email.value = { ...invoice.pending_emails[0], invoice_id: invoice.id };
  } else {
    selected_pending_email.value = {
      recipient_email: invoice.customer.email,
      invoice_id: invoice.id,
      cron_task: { active: true },
    };
  }
}
</script>
