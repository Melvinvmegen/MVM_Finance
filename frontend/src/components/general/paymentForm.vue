<template lang="pug">
v-card(width="800")
  v-form(@submit.prevent="handleSubmit")
    v-card-title {{ "paid" in mutableModel ? "Editer la facture" : "Editer le devis" }}
    v-card-text
      v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
      v-row
        v-col
          v-select(:items="items" item-title="createdAt" item-value="id" name='revenuId' v-model="mutableModel.RevenuId" label='Revenu' density="compact" )
        v-col
          label Date de paiement
          input(name='paymentDate' v-model="mutableModel.paymentDate" type='hidden')
          DatePicker(
            name="paymentDate",
            class="form-control",
            v-model="mutableModel.paymentDate",
            inputFormat="dd/MM/yyyy"
          )
          v-icon mdi-calendar

    v-card-actions
      v-btn.bg-secondary.text-white(type="submit") Sauvegarder

</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import DatePicker from "vue3-datepicker";
import type Invoice from "../types/Invoice";
import type Quotation from "../types/Quotation";
import type Revenu from "../types/Revenu";
import type { PropType } from "vue";
import useFilter from "../../hooks/filter";
import { useIndexStore } from "../../store/indexStore.ts";
import { useInvoiceStore } from "../../store/invoiceStore.ts";
import { useRevenuStore } from "../../store/revenuStore.ts";
import { useQuotationStore } from "../../store/quotationStore.ts";

const props = defineProps({
  model: {
    type: Object as PropType<Invoice> | PropType<Quotation>,
    required: true,
  },
});

const mutableModel = reactive<Invoice | Quotation>(props.model);
const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
const emit = defineEmits(['close'])
const { compute, filterAll } = useFilter(revenuStore, "revenus");
const { items } = compute;
filterAll("Revenus");
mutableModel.paymentDate = new Date(props.model.paymentDate);

async function handleSubmit(): Promise<void> {
  let action: string;
  let store: any;
  if ("paid" in mutableModel) {
    mutableModel.paid = true;
    action = "updateInvoice";
    store = useInvoiceStore();
  } else {
    mutableModel.cautionPaid = true;
    action = "updateQuotation";
    store = useQuotationStore();
  }
  try {
    const res = await store[action](mutableModel);
    emit("close");
  } finally {
    indexStore.setLoading(false);
  }
}
</script>