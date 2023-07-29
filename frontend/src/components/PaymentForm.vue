<template lang="pug">
v-card(width="800")
  v-form(@submit.prevent="handleSubmit" class="my-8")
    v-card-title.text-center {{ "paid" in mutableModel ? $t("invoice.editInvoice") : $t("quotation.editQuotation") }}
    v-card-text
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
import { getRevenus, updateInvoice, updateQuotation } from "../utils/generated/api-user";
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
const loadingStore = useLoadingStore();
const emit = defineEmits(["close"]);
const { compute, filterAll } = useFilter([], () => getRevenus());
const { items } = compute;
filterAll();
mutableModel.paymentDate = props.model.paymentDate ? new Date(props.model.paymentDate) : new Date();

async function handleSubmit(): Promise<void> {
  try {
    if ("paid" in mutableModel) {
      await updateInvoice(mutableModel.id, {
        ...mutableModel,
        paid: true,
      });
    } else {
      await updateQuotation(mutableModel.id, {
        ...mutableModel,
        cautionPaid: true,
      });
    }
    emit("close");
  } finally {
    loadingStore.setLoading(false);
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
