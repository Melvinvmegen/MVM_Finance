<template lang="pug">
v-card.pa-4(v-if="props.model")
  template(v-if="props.model.InvoiceItems")
    v-card-subtitle(v-if="quotationId")  {{ $t("totalField.quotationNumber", [quotationId]) }}
    v-card-subtitle.d-flex.justify-end {{ $t("totalField.invoiceNumber", [props.model.id]) }}
    v-card-subtitle.d-flex.justify-end {{ props.model.company }}
    v-card-subtitle.d-flex.justify-end {{ $t("totalField.invoiceFor") }}
    v-card-subtitle.d-flex.justify-end {{ props.model.firstName }} {{ props.model.lastName }}
    v-card-subtitle.d-flex.justify-end.mb-12 {{ props.model.address }}  {{ props.model.zipcode }}  {{ props.model.city }}
  hr.mx-2.my-4
  v-row.mx-1(justify="space-between" align="center")
    v-card-subtitle {{ $t("totalField.total") }}
    v-card-title {{ $n(Math.round(props.model.total), "currency") }}
  v-row.mx-1(justify="space-between" v-if='initialTvaApplicable' align="center")
    v-card-subtitle {{ $t("totalField.withVAT") }}
    v-card-title {{ $n(Math.round(initialTvaAmount), "currency") }}
  div(v-if='initialTvaApplicable')
    hr.mx-2.my-4
    v-row.mx-1(justify="space-between" align="center")
        v-card-subtitle {{ $t("totalField.totalVAT") }}
        v-card-title {{ $n(Math.round(initialTotalTTC), "currency") }}
  hr.mx-2.my-4
</template>

<script setup lang="ts">
const props = defineProps({
  model: {
    type: Object,
  },
  initialTvaApplicable: {
    type: Boolean,
    default: false,
  },
  initialTotalTTC: {
    type: Number,
    default: 0,
  },
  initialTvaAmount: {
    type: Number,
    default: 0,
  },
  totalTVA: {
    type: Number,
    default: 0,
  },
});

const quotationId = computed(() => {
  if (props.model?.InvoiceItems?.length) {
    return props.model?.InvoiceItems[0]?.QuotationId;
  }
  return "";
});
</script>
