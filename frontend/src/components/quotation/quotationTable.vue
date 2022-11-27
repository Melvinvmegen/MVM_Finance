<template lang="pug">
v-card(elevation="3")
  v-card-title
    v-row(justify="space-between" align="center")
      v-col(cols="11")
        v-row(align="center")
          v-btn(icon="mdi-arrow-left" variant="text" @click='router.push("/customers")' color="primary")
          .text-uppercase.px-0 Quotations

      v-spacer  
      v-col(cols="1")
        router-link(:to="{ path: `/quotations/new`, query: { customerId: props.customerId }}")
          v-btn(icon="mdi-plus" color="primary")

  v-card-text
    v-form(@submit.prevent ref="searchFrom")
      v-row
        v-col.mr-2(cols="12" sm="3" md="2")
          v-text-field(variant="outlined" hide-details density="compact" label='Total' name='by_total' v-model='query.total' @blur='filterAll(itemName, true)')

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
              | Nom
            th.text-left
              | Total
            th.text-left
              | Caution
            th.text-left
              | Caution payé
            th.text-left 
              | Actions
        tbody
          tr(v-for="quotation in items", :key="quotation.id" @click='pushToShow($event, quotation)')
            td {{ quotation.RevenuId }}
            td {{ `${quotation.lastName} ${quotation.firstName}` }}
            td {{ quotation.total }}
            td {{ quotation.total * 0.3 }}
            td {{ quotation.cautionPaid }}
            td
              v-row
                v-btn(variant="text" icon="mdi-cash" @click.stop="selectedQuotation = quotation" v-if='!quotation.cautionPaid')
                v-btn(variant="text" icon="mdi-receipt" @click.stop="downloadPDF(quotation, lowerCaseItemName)")
                v-btn(
                  variant="text" 
                  icon="mdi-file-swap" 
                  v-if="!quotation.InvoiceId"
                  @click.stop="convertToInvoice(quotation, `Vous êtes sur de vouloir convertir le devis ${quotation.id} en facture ?`)"
                )
                v-btn(
                  variant="text" 
                  icon="mdi-delete"
                  @click.stop="deleteItem(quotation, 'Quotation', `Vous êtes sur de vouloir supprimer le devis ${quotation.id}`)",
                  :key="quotation.id"
                )

  v-dialog(v-model="selectedQuotation" width='800')
    payment-form(:model='selectedQuotation' @close="selectedQuotation = null")

  v-pagination(v-model="query.currentPage" :total-visible='query.perPage' :length='pages')

</template>

<script setup lang="ts">
import useFilter from "../../hooks/filter";
import useDelete from "../../hooks/delete";
import useDownload from "../../hooks/download";
import PaymentForm from "../general/paymentForm.vue";
import type Quotation from "../types/Quotation";
import { useRouter } from "vue-router";
import { ref } from "vue";
import { useIndexStore } from "../../store/indexStore.ts";
import { useQuotationStore } from "../../store/quotationStore.ts";

const props = defineProps({
  customerId: {
    type: [Number, String],
    require: true,
  },
});

const quotationStore = useQuotationStore();
const indexStore = useIndexStore();
const { compute, filterAll, query } = useFilter(quotationStore, "quotations", {
  CustomerId: props.customerId,
});
const { items, pages } = compute;
const { deleteItem } = useDelete(quotationStore);
const { downloadPDF } = useDownload(quotationStore);
query.name = undefined;
query.total = undefined;
const lowerCaseItemName = "quotation";
const itemName = "Quotations";
const router = useRouter();
const searchFrom = ref(null)
const selectedQuotation = ref(null);

filterAll(itemName);

function pushToShow(event, quotation: Quotation) {
  router.push({
    path: `/quotations/edit/${quotation.id}`,
    query: { customerId: props.customerId },
  });
}

function resetAll() {
  searchFrom.value.reset()
  filterAll(itemName, true)
}

function convertToInvoice(quotation: Quotation, confirmString: string) {
  indexStore.setLoading(true);
  const result = confirm(confirmString);
  if (result) {
    return quotationStore.convertToInvoice(quotation)
  }
  indexStore.setLoading(false);
}
</script>
