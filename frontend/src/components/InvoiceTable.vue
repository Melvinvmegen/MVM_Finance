<template lang="pug">
v-card(elevation="3")
  v-card-title
    v-row(justify="space-between" align="center")
      v-col(cols="11")
        v-row(align="center")
          v-btn(icon="mdi-arrow-left" variant="text" @click='router.push("/customers")' color="primary")
          .text-uppercase Invoices

      v-spacer  
      v-col(cols="1")
        router-link(:to="{ path: `/invoices/new`, query: { customerId: props.customerId }}")
          v-btn(icon="mdi-plus" color="primary")

  v-card-text
    v-form(@submit.prevent ref="searchFrom")
      v-row
        v-col.mr-2(cols="12" sm="3" md="2")
          v-text-field(hide-details label='Total' name='by_total' v-model='query.total' @blur='filterAll(itemName, true)')

        v-row(align="center")
          v-btn.bg-secondary Rechercher
          v-icon.ml-2(@click="resetAll()") mdi-restore

    v-col(cols="12")
      v-table
        thead
          tr
            th.text-left
              | Revenu
            th.text-left
              | Client
            th.text-left
              | Total
            th.text-left
              | TVA Applicable
            th.text-left
              | Payé
            th.text-left
              | Actions
        tbody
          tr(v-for="invoice in items.filter(item => item?.CustomerId === props?.customerId)", :key="invoice.id" @click='pushToShow($event, invoice)')
            td {{ revenuDate(invoice.Revenus) }}
            td {{ invoice.lastName + invoice.firstName }}
            td {{ invoice.totalTTC }}
            td {{ invoice.tvaAmount }}
            td {{ invoice.paid }}
            td
              v-row
                v-btn(variant="text" icon="mdi-cash" @click.stop="selectedInvoice = invoice" v-if='!invoice.paid' )
                v-btn(variant="text" icon="mdi-receipt" @click.stop="downloadPDF(invoice, 'invoice')")
                v-btn(variant="text" icon="mdi-email" @click.stop="sendEmail(invoice)")
                v-btn(
                  variant="text" 
                  icon="mdi-delete"
                  @click.stop="deleteItem(invoice, 'Invoice', `Vous êtes sur de vouloir supprimer la facture ${invoice.id}`)",
                  :key="invoice.id"
                )

  v-dialog(v-model="selectedInvoice" width='800')
    payment-form(:model='selectedInvoice' @close="selectedInvoice = null")
  v-pagination(v-model="query.currentPage" :length='pages')
</template>

<script setup lang="ts">
import type { Revenus, Invoices } from "../../../types/models";

const props = defineProps({
  customerId: {
    type: [Number, String],
    required: true,
  },
});
const invoiceStore = useInvoiceStore();
const indexStore = useIndexStore();
const { compute, filterAll, query } = useFilter(invoiceStore, "invoices", {
  CustomerId: props.customerId,
});
const { pages, items } = compute;
const { deleteItem } = useDelete(invoiceStore);
const { downloadPDF } = useDownload(invoiceStore);
query.name = undefined;
query.total = undefined;
const itemName = "Invoices";
const router = useRouter();
const searchFrom = ref(null);
const selectedInvoice = ref(null);
filterAll(itemName);

async function sendEmail(invoice: Invoices) {
  indexStore.setLoading(true);
  await invoiceStore.sendEmailInvoice(invoice);
  indexStore.setLoading(false);
  return;
}

function resetAll() {
  searchFrom.value.reset();
  filterAll(itemName, true);
}

function revenuDate(revenu: Revenus) {
  if (!revenu) return;
  const date = new Date(revenu.createdAt);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function pushToShow(event, invoice: Invoices) {
  if (invoice.id && event.target.nodeName === "TD") {
    router.push({
      path: `/invoices/edit/${invoice.id}`,
      query: { customerId: props.customerId },
    });
  }
}
</script>
