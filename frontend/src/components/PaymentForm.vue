<template lang="pug">
v-card(width="800")
  v-form(@submit.prevent="handleSubmit" class="my-8")
    v-card-title.text-center {{ "paid" in mutableModel ? $t("invoice.editInvoice") : $t("quotation.editQuotation") }}
    v-card-text
      v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
      v-row.my-2(justify="center")
        v-col(cols="12" sm="6")
          v-select(:items="items" item-title="createdAt" item-value="id" name='revenuId' v-model="mutableModel.RevenuId" :label='$t("invoice.revenu")'  )
      v-row.my-2(justify="center")
        v-col(cols="12" sm="6")
          label {{ $t("invoice.paymentDate") }}
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
      v-btn.bg-secondary.text-white.my-2(type="submit") {{ $t("invoice.save") }}

</template>

<script setup lang="ts">
import type { Quotations, Invoices, Revenus } from "../../types/models";
type InvoiceWithRevenu = Invoices & { Revenus: Revenus | undefined };
type QuotationsWithRevenu = Quotations & { Revenus: Revenus | undefined };

const props = defineProps({
  model: {
    type: Object as PropType<InvoiceWithRevenu> | PropType<QuotationsWithRevenu>,
    required: true,
  },
});

const mutableModel = reactive<InvoiceWithRevenu | QuotationsWithRevenu>(props.model);
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
