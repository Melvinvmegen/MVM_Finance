<template lang="pug">
v-card(width="600")
  v-form(v-model="valid" @submit.prevent="handleSubmit" class="my-8")
    v-card-title.text-center {{ "paid" in mutable_model ? $t("invoice.editInvoice") : $t("quotation.editQuotation") }}
    v-card-text
      v-row.my-2(justify="center")
        v-col(cols="12" sm="8")
          v-select(:items="revenus" :item-props="itemProps" name='revenuId' v-model="mutable_model.revenu_id" :label='$t("invoice.revenu")')
      v-row.my-2(justify="center")
        v-col(cols="12" sm="8")
          label {{ $t("invoice.paymentDate") }}
          DateInput(v-model="mutable_model.payment_date")

    v-card-actions(class="justify-center")
      v-btn.bg-secondary.text-white.my-2(type="submit") {{ $t("invoice.save") }}

</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { getRevenuIds, updateInvoice, updateQuotation } from "../utils/generated/api-user";
import type { quotation, invoice, revenu } from "../../types/models";
type InvoiceWithRevenu = invoice & { revenu: revenu | undefined };
type QuotationsWithRevenu = quotation & { revenu: revenu | undefined };

const props = defineProps({
  model: {
    type: Object as PropType<InvoiceWithRevenu> | PropType<QuotationsWithRevenu>,
    required: true,
  },
});
const valid = ref(false);
const mutable_model = reactive<InvoiceWithRevenu | QuotationsWithRevenu>(props.model);
const loadingStore = useLoadingStore();
const emit = defineEmits(["close"]);
const revenus = ref();

onMounted(async () => {
  mutable_model.payment_date = dayjs(props.model.payment_date || undefined).toDate();
  revenus.value = await getRevenuIds();
});

async function handleSubmit(): Promise<void> {
  if (!valid.value) return;
  if ("paid" in mutable_model) {
    await updateInvoice(mutable_model.customer_id, mutable_model.id, {
      ...mutable_model,
      paid: true,
    });
    useMessageStore().i18nMessage("success", "invoices.updated");
  } else {
    await updateQuotation(mutable_model.customer_id, mutable_model.id, {
      ...mutable_model,
      caution_paid: true,
    });
    useMessageStore().i18nMessage("success", "quotations.updated");
  }
  emit("close");
  loadingStore.setLoading(false);
}

function itemProps(item) {
  return {
    title: dayjs(item.created_at).format("MMMM YYYY"),
    value: item.id,
  };
}

watch(
  () => mutable_model.revenu_id,
  (revenu_id: number) => {
    const revenu = revenus.value.find((item) => item.id === revenu_id);
    mutable_model.payment_date = dayjs(revenu.created_at).toDate();
  },
);
</script>
