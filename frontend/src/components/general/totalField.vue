<template lang="pug">
template(v-if="model.InvoiceItems")
  v-card-subtitle(v-if="quotationId") Devis n°{{ quotationId }}
  v-card-subtitle Facture n°{{ model.id }}
  v-card-subtitle.justify-end {{ model.company }}
  v-card-subtitle.justify-end A l'attention de M. ou Mme
  v-card-subtitle.justify-end {{ model.firstName }} {{ model.lastName }}
  v-card-subtitle.justify-end {{ model.address }}  {{ model.zipcode }}  {{ model.city }}
v-row(justify="space-around" align="center" v-if="model.pro")
  v-card-subtitle Total Pro
  v-card-title {{ Math.round(model.pro) }} €
v-row(justify="space-around" align="center" v-if="model.perso")
  v-card-subtitle Total Perso
  v-card-title {{ Math.round(model.perso) }} €
hr.mx-2.my-4
v-row(justify="space-around" align="center")
  v-card-subtitle Total
  v-card-title {{ Math.round(model.total) }} €
v-row(justify="space-around" v-if='initialTvaApplicable' align="center")
  v-card-subtitle Dont TVA
  v-card-title {{ Math.round(initialTvaAmount) }} €
v-row(justify="space-around" align="center" v-if="model.expense")
  v-card-subtitle Dépenses
  v-card-title(v-if="model.expense") {{ Math.round(model.expense) }} €
  v-card-title(v-else) {{ Math.round(model.expense) }} €
hr.mx-2.my-4
v-row(justify="space-around" align="center" v-if='initialTvaApplicable')
    v-card-subtitle Total TTC
    v-card-title {{ Math.round(initialTotalTTC) }} €
v-row(justify="space-around" align="center" v-if="model.total && model.expense")
  v-card-subtitle Balance
  v-card-title {{ Math.round(model.total - Math.abs(model.expense)) }} €
hr.mx-2.my-4
v-row(justify="space-around" align="center" v-if='model.tva_collected')
  v-card-subtitle TVA collectée
  v-card-title -{{ Math.round(model.tva_collected) }} €
v-row(justify="space-around" align="center" v-if='model.tva_dispatched')
  v-card-subtitle TVA déductible
  v-card-title {{ Math.round(model.tva_dispatched) }} €
v-row(justify="space-around" align="center" v-if='model.tva_collected')
  v-card-subtitle TVA Total
  v-card-title {{ Math.round(+model.tva_dispatched - +model.tva_collected) }} €
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
