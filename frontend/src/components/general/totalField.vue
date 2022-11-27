<template lang="pug">
v-card(position="fixed")
  v-card-text
    template(v-if="parent.InvoiceItems")
      v-card-subtitle Facture n°{{ parent.id }}
      v-card-subtitle.justify-end {{ parent.company }}
      v-card-subtitle.justify-end A l'attention de M. ou Mme
      v-card-subtitle.justify-end {{ parent.firstName }} {{ parent.lastName }}
      v-card-subtitle.justify-end {{ parent.address }}  {{ parent.zipcode }}  {{ parent.city }}
    v-row(justify="space-around" align="center" v-if="parent.pro")
      v-card-subtitle Total Pro
      v-card-title {{ Math.round(parent.pro) }} €
    v-row(justify="space-around" align="center" v-if="parent.perso")
      v-card-subtitle Total Perso
      v-card-title {{ Math.round(parent.perso) }} €
    hr.mx-2.my-4
    v-row(justify="space-around" align="center")
      v-card-subtitle Total
      v-card-title {{ Math.round(parent.total) }} €
    template(v-if='initialTvaApplicable')
      v-row(justify="space-around" align="center")
        v-card-subtitle Dont TVA
        v-card-title {{ Math.round(initialTvaAmount) }} €
      v-row(justify="space-around" align="center")
        v-card-subtitle Total TTC
        v-card-title {{ Math.round(initialTotalTTC) }} €
    v-row(justify="space-around" align="center" v-if="parent.expense")
      v-card-subtitle Dépenses
      v-card-title(v-if="parent.expense") {{ Math.round(parent.expense) }} €
      v-card-title(v-else) {{ Math.round(parent.expense) }} €
    v-row(justify="space-around" align="center" v-if="parent.total && parent.expense")
      v-card-subtitle Balance
      v-card-title {{ Math.round(parent.total - Math.abs(parent.expense)) }} €
    hr.mx-2.my-4
    v-row(justify="space-around" align="center" v-if='parent.tva_collected')
      v-card-subtitle TVA collectée
      v-card-title -{{ Math.round(parent.tva_collected) }} €
    v-row(justify="space-around" align="center" v-if='parent.tva_dispatched')
      v-card-subtitle TVA déductible
      v-card-title {{ Math.round(parent.tva_dispatched) }} €
    v-row(justify="space-around" align="center" v-if='parent.tva_collected')
      v-card-subtitle TVA Total
      v-card-title {{ Math.round(+parent.tva_dispatched - +parent.tva_collected) }} €
</template>
<script setup lang="ts">

const props = defineProps({
  parent: {
    type: Object
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
  }
});
</script>