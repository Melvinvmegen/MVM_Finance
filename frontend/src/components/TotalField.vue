<template lang="pug">
template(v-if="model.InvoiceItems")
  v-card-subtitle(v-if="quotationId")  {{ $t("totalField.quotationNumber", [quotationId]) }}
  v-card-subtitle {{ $t("totalField.invoiceNumber", [model.id]) }}
  v-card-subtitle.justify-end {{ model.company }}
  v-card-subtitle.justify-end {{ $t("totalField.invoiceFor") }}
  v-card-subtitle.justify-end {{ model.firstName }} {{ model.lastName }}
  v-card-subtitle.justify-end {{ model.address }}  {{ model.zipcode }}  {{ model.city }}
v-row(justify="space-around" align="center" v-if="model.pro")
  v-card-subtitle {{ $t("totalField.totalPro") }}
  v-card-title {{ $n(Math.round(model.pro), "currency") }}
v-row(justify="space-around" align="center" v-if="model.perso")
  v-card-subtitle {{ $t("totalField.totalPerso") }}
  v-card-title {{ $n(Math.round(model.perso), "currency") }}
hr.mx-2.my-4
v-row(justify="space-around" align="center")
  v-card-subtitle {{ $t("totalField.total") }}
  v-card-title {{ $n(Math.round(model.total), "currency") }}
v-row(justify="space-around" v-if='initialTvaApplicable' align="center")
  v-card-subtitle {{ $t("totalField.withVAT") }}
  v-card-title {{ $n(Math.round(initialTvaAmount), "currency") }}
v-row(justify="space-around" align="center" v-if="model.expense")
  v-card-subtitle {{ $t("totalField.expenses") }}
  v-card-title(v-if="model.expense") {{ $n(Math.round(model.expense), "currency") }}
  v-card-title(v-else) {{ $n(Math.round(model.expense), "currency") }}
hr.mx-2.my-4
v-row(justify="space-around" align="center" v-if='initialTvaApplicable')
    v-card-subtitle {{ $t("totalField.totalVAT") }}
    v-card-title {{ $n(Math.round(initialTotalTTC), "currency") }}
v-row(justify="space-around" align="center" v-if="model.total && model.expense")
  v-card-subtitle {{ $t("totalField.balance") }}
  v-card-title {{ $n(Math.round(model.total - Math.abs(model.expense)), "currency") }}
hr.mx-2.my-4
v-row(justify="space-around" align="center" v-if='model.tva_collected')
  v-card-subtitle {{ $t("totalField.vatCollected") }}
  v-card-title -{{ $n(Math.round(model.tva_collected), "currency") }}
v-row(justify="space-around" align="center" v-if='model.tva_dispatched')
  v-card-subtitle {{ $t("totalField.vatDeductible") }}
  v-card-title {{ $n(Math.round(model.tva_dispatched), "currency") }}
v-row(justify="space-around" align="center" v-if='model.tva_collected')
  v-card-subtitle {{ $t("totalField.vatTotal") }}
  v-card-title {{ $n(Math.round(+model.tva_dispatched - +model.tva_collected), "currency") }}
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
