<template lang="pug">
v-card(width="600")
  v-form(v-model="valid" @submit.prevent="handleSubmit" class="my-8")
    v-card-title.text-center {{ "paid" in mutableModel ? $t("invoice.editInvoice") : $t("quotation.editQuotation") }}
    v-card-text
      v-row.my-2(justify="center")
        v-col(cols="12" sm="8")
          v-select(:items="revenus" :item-props="itemProps" name='revenuId' v-model="mutableModel.RevenuId" :label='$t("invoice.revenu")')
      v-row.my-2(justify="center")
        v-col(cols="12" sm="8")
          label {{ $t("invoice.paymentDate") }}
          DateInput(v-model="mutableModel.paymentDate")

    v-card-actions(class="justify-center")
      v-btn.bg-secondary.text-white.my-2(type="submit") {{ $t("invoice.save") }}

</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { getRevenuIds, updateInvoice, updateQuotation } from "../utils/generated/api-user";
import type { Quotations, Invoices, Revenus } from "../../types/models";
type InvoiceWithRevenu = Invoices & { Revenus: Revenus | undefined };
type QuotationsWithRevenu = Quotations & { Revenus: Revenus | undefined };

const props = defineProps({
  model: {
    type: Object as PropType<InvoiceWithRevenu> | PropType<QuotationsWithRevenu>,
    required: true,
  },
});
const valid = ref(false);
const mutableModel = reactive<InvoiceWithRevenu | QuotationsWithRevenu>(props.model);
const loadingStore = useLoadingStore();
const emit = defineEmits(["close"]);
const revenus = ref();

onMounted(async () => {
  mutableModel.paymentDate = dayjs(props.model.paymentDate || undefined).toDate();
  revenus.value = await getRevenuIds();
});

async function handleSubmit(): Promise<void> {
  if (!valid.value) return;
  if ("paid" in mutableModel) {
    await updateInvoice(mutableModel.CustomerId, mutableModel.id, {
      ...mutableModel,
      paid: true,
    });
    useMessageStore().i18nMessage("success", "invoices.updated");
  } else {
    await updateQuotation(mutableModel.CustomerId, mutableModel.id, {
      ...mutableModel,
      cautionPaid: true,
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
  () => mutableModel.RevenuId,
  (revenuId) => {
    const revenu = revenus.value.find((item) => item.id === revenuId);
    mutableModel.paymentDate = dayjs(revenu.created_at).toDate();
  },
);
</script>
