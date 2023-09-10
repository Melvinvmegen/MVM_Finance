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
        router-link(:to="`/customers/${route.params.customerId}/invoices/new`")
          v-btn(icon="mdi-plus" color="primary")

  v-card-text
    v-form(@submit.prevent ref="searchFrom")
      v-row
        v-col.mr-2(cols="12" sm="5" md="4" lg="3")
          v-text-field(hide-details :label='$t("invoice.searchByTotal")' name='by_total' v-model='query.totalTTC' @blur='searchInvoices')

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
        template( v-slot:[`item.paid`]="{ item }")
          v-chip(:color="item.raw.paid ? 'success' : 'error'") {{ $t(`invoices.paidStatus.${item.raw.paid}`)  }}
        template( v-slot:[`item.month`]="{ item }")
          span {{ revenuDate(item.raw.Revenus) }}
        template( v-slot:[`item.date`]="{ item }")
          span(v-if="item.raw.paymentDate") {{ dayjs(item.raw.paymentDate).format("DD/MM/YYYY") }}
        template( v-slot:[`item.total`]="{ item }")
          span {{ $n(item.raw.totalTTC, "currency") }}
        template( v-slot:[`item.tvaAmount`]="{ item }")
          span {{ $n(item.raw.tvaAmount, "currency") }}
        template(v-slot:item.actions="{ item }")
          v-btn(variant="text" size="small" icon="mdi-cash" @click.stop="openInvoiceModel = true; selectedInvoice = item.raw" v-if='!item.raw.paid' )
          v-btn(variant="text" size="small" icon="mdi-receipt" @click.stop="download(item.raw)")
          v-btn(variant="text" size="small" icon="mdi-email" @click.stop="sendEmail(item.raw)")
          v-btn(
            v-if="!item.raw.paid"
            variant="text" size="small" 
            icon="mdi-pen"
            :to="`/customers/${route.params.customerId}/invoices/${item.raw.id}`"
          )
          v-btn(
            v-if="!item.raw.paid"
            variant="text" size="small" 
            icon="mdi-delete"
            @click.stop="deleteItem(item.raw, $t('invoices.confirmDelete', [item.raw.id]))",
          )

v-dialog(v-model="openInvoiceModel")
  PaymentForm(:model='selectedInvoice' @close="closePaymentForm")
</template>

<script setup lang="ts">
import { getInvoices, deleteInvoice, downloadInvoice, sendInvoice } from "../utils/generated/api-user";
import type { Revenus, Invoices, Query } from "../../types/models";
import dayjs from "dayjs";

const loadingStore = useLoadingStore();
const { filterAll, items } = useFilter(getInvoices);
const { deleteItem } = useDelete(deleteInvoice);
const searchFrom = ref<HTMLFormElement | null>(null);
const selectedInvoice = ref(null);
const openInvoiceModel = ref(false);
const { t: $t } = useI18n();
const query = ref<Query>({});
const route = useRoute();
const dataTable = {
  perPage: 12,
  headers: [
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
      key: "tvaAmount",
      value: "tvaAmount",
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

onMounted(async () => {
  await filterAll({
    CustomerId: +route.params.customerId,
  });
});

async function searchInvoices() {
  await filterAll({
    CustomerId: +route.params.customerId,
    ...query.value,
    force: true,
  });
}

async function getInvoicesData({ page, itemsPerPage, sortBy }) {
  await filterAll({
    CustomerId: +route.params.customerId,
    force: true,
    currentPage: page,
    perPage: itemsPerPage,
    sortBy,
  });
}

async function download(invoice: Invoices) {
  loadingStore.setLoading(true);
  try {
    await downloadInvoice(invoice.CustomerId, invoice.id);
    useMessageStore().i18nMessage("success", "invoices.downloaded");
  } finally {
    loadingStore.setLoading(false);
  }
}

async function sendEmail(invoice: Invoices) {
  loadingStore.setLoading(true);
  try {
    await sendInvoice(invoice.CustomerId, invoice.id);
    useMessageStore().i18nMessage("success", "invoices.emailSent");
  } finally {
    loadingStore.setLoading(false);
  }
}

async function resetAll() {
  searchFrom.value?.reset();
  query.value = {};
  await searchInvoices();
}

function revenuDate(revenu: Revenus) {
  if (!revenu) return;
  return dayjs(revenu.createdAt).format("MMMM YYYY");
}

async function closePaymentForm() {
  openInvoiceModel.value = false;
  selectedInvoice.value = null;
  await searchInvoices();
}
</script>
