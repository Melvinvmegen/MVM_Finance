<template lang="pug">
v-card(width="800")
  v-form(@submit.prevent="handleSubmit" class="my-8")
    v-card-title.text-center {{ "paid" in mutableModel ? "Editer la facture" : "Editer le devis" }}
    v-card-text
      v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
      v-row.my-2(justify="center")
        v-col(cols="12" sm="6")
          v-select(:items="items" item-title="createdAt" item-value="id" name='revenuId' v-model="mutableModel.RevenuId" label='Revenu' density="compact" )
      v-row.my-2(justify="center")
        v-col(cols="12" sm="6")
          label Date de paiement
          Datepicker(
            name="paymentDate",
            v-model="mutableModel.paymentDate",
            format="dd/MM/yyyy"
            dark
            position="center"
            :month-change-on-scroll="false"
            auto-apply
          )

    v-card-actions(class="justify-center")
      v-btn.bg-secondary.text-white.my-2(type="submit") Sauvegarder

</template>

<script setup lang="ts">
import type Invoice from "../types/Invoice";
import type Quotation from "../types/Quotation";

const props = defineProps({
  model: {
    type: Object as PropType<Invoice> | PropType<Quotation>,
    required: true,
  },
});

const mutableModel = reactive<Invoice | Quotation>(props.model);
const indexStore = useIndexStore();
const revenuStore = useRevenuStore();
const emit = defineEmits(["close"]);
const { compute, filterAll } = useFilter(revenuStore, "revenus");
const { items } = compute;
filterAll("Revenus");
mutableModel.paymentDate = props.model.paymentDate ? new Date(props.model.paymentDate) : new Date();

async function handleSubmit(): Promise<void> {
  let action: string;
  let store: any;
  delete mutableModel.Revenus;
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
    await store[action](mutableModel);
    emit("close");
  } finally {
    indexStore.setLoading(false);
  }
}

watch(
  () => mutableModel.RevenuId,
  (revenuId) => {
    const revenu = items.value.find((item) => item.id === revenuId);
    mutableModel.paymentDate = new Date(revenu.createdAt);
  },
);
</script>
