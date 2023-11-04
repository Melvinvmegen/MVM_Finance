<template lang="pug">
v-card.pa-4(v-if="props.model")
  template(v-if="props.model.InvoiceItems")
    v-card-subtitle(v-if="quotationId")  {{ $t("totalField.quotationNumber", [quotationId]) }}
    v-card-subtitle.d-flex.justify-end {{ $t("totalField.invoiceNumber", [props.model.id]) }}
    v-card-subtitle.d-flex.justify-end {{ props.model.company }}
    v-card-subtitle.d-flex.justify-end {{ $t("totalField.invoiceFor") }}
    v-card-subtitle.d-flex.justify-end {{ props.model.firstName }} {{ props.model.lastName }}
    v-card-subtitle.d-flex.justify-end.mb-12 {{ props.model.address }}  {{ props.model.zipcode }}  {{ props.model.city }}
  v-row.mx-1(justify="space-between" align="center" v-if="props.model.pro")
    v-card-subtitle {{ $t("totalField.totalPro") }}
    v-card-title {{ $n(Math.round(props.model.pro), "currency") }}
  v-row.mx-1(justify="space-between" align="center" v-if="props.model.perso")
    v-card-subtitle {{ $t("totalField.totalPerso") }}
    v-card-title {{ $n(Math.round(props.model.perso), "currency") }}
  hr.mx-2.my-4
  v-row.mx-1(justify="space-between" align="center")
    v-card-subtitle {{ $t("totalField.total") }}
    v-card-title {{ $n(Math.round(props.model.total), "currency") }}
  v-row.mx-1(justify="space-between" v-if='initialTvaApplicable' align="center")
    v-card-subtitle {{ $t("totalField.withVAT") }}
    v-card-title {{ $n(Math.round(initialTvaAmount), "currency") }}
  v-row.mx-1(justify="space-between" align="center" v-if="props.model.expense")
    v-card-subtitle {{ $t("totalField.expenses") }}
    v-card-title(v-if="props.model.expense") {{ $n(Math.round(props.model.expense), "currency") }}
    v-card-title(v-else) {{ $n(Math.round(props.model.expense), "currency") }}
  div(v-if='initialTvaApplicable')
    hr.mx-2.my-4
    v-row.mx-1(justify="space-between" align="center")
        v-card-subtitle {{ $t("totalField.totalVAT") }}
        v-card-title {{ $n(Math.round(initialTotalTTC), "currency") }}
  template(v-if="props.model.total && props.model.expense")
    hr.mx-2.my-4
    v-row.mx-1(justify="space-between" align="center")
      v-card-subtitle {{ $t("totalField.balance") }}
      v-card-title {{ $n(returnBalance, "currency") }}
  hr.mx-2.my-4
  v-row.mx-1(justify="space-between" align="center" v-if='props.model.tva_collected')
    v-card-subtitle {{ $t("totalField.vatCollected") }}
    v-card-title -{{ $n(Math.round(props.model.tva_collected), "currency") }}
  v-row.mx-1(justify="space-between" align="center" v-if='props.model.tva_dispatched')
    v-card-subtitle {{ $t("totalField.vatDeductible") }}
    v-card-title {{ $n(Math.round(props.model.tva_dispatched), "currency") }}
  v-row.mx-1(justify="space-between" align="center" v-if='props.model.tva_collected')
    v-card-subtitle {{ $t("totalField.vatTotal") }}
    v-card-title {{ $n(Math.round(+props.model.tva_dispatched - +props.model.tva_collected), "currency") }}
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

const returnRevenuNet = computed(() => {
  if (!props.model?.pro && props.model?.taxPercentage) return 0;
  if (props.model?.taxPercentage) {
    return Math.round(props.model?.pro / (1 + props.model?.taxPercentage / 100));
  } else {
    return Math.round(props.model?.pro);
  }
});

const returnBalance = computed(() => {
  const revenuAmount = returnRevenuNet.value + props.model?.perso || props.model?.total;
  return Math.round(revenuAmount - Math.abs(props.model?.expense));
});
</script>
