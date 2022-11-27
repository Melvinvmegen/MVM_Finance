<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row
    v-col(cols="12" sm="3" md="2")
      v-text-field(variant="outlined" density="compact" hide-details label='Nom & prénom' name='by_name' v-model='query.firstName' @blur='filterAll(itemName, true)')

    v-col(cols="12" sm="3" md="2")
      v-text-field(variant="outlined" density="compact" hide-details label='Email' name='by_email' v-model='query.email' @blur='filterAll(itemName, true)')

    v-col(cols="12" sm="3" md="2")
      v-text-field(variant="outlined" density="compact" hide-details label='Ville' name='by_city' v-model='query.city' @blur='filterAll(itemName, true)')

    v-col.mr-2(cols="12" sm="3" md="2")
      v-text-field(variant="outlined" hide-details density="compact" label='Téléphone' name='by_phone' v-model='query.phone' @blur='filterAll(itemName, true)')

    v-row(align="center")
      v-btn.bg-secondary Rechercher
      v-icon.ml-2(@click="resetAll()") mdi-restore

v-col(cols="12")
  v-table
    thead
      tr
        th.text-left
          | Nom
        th.text-left
          | Prénom
        th.text-left
          | Email
        th.text-left
          | Téléphone
        th.text-left
          | Revenus
        th.text-left
          | Montant impayé
        th.text-left
          | TVA récoltée
        th.text-left
          | Actions
    tbody
      tr(v-for='customer in items' :key='customer.id' @click='pushToShow(customer)')
        td {{ customer.lastName }}
        td {{ customer.firstName }}
        td {{ customer.email }}
        td {{ customer.phone }}
        td {{ customer.invoices_total }}
        td {{ returnUnpaidInvoiceTotal(customer) }}
        td {{ customer.tva_amount_collected }}
        td
          v-btn(color='red' variant="text" icon="mdi-delete" @click.stop="deleteItem(customer, 'Customer', `Vous êtes sur de vouloir supprimer la customer ${customer.firstName} ${customer.lastName}` )" :key='customer.id')

v-pagination(v-model="query.currentPage" :total-visible='query.perPage' :length='pages')
</template>

<script setup lang="ts">
import useFilter from "../../hooks/filter";
import useDelete from "../../hooks/delete";
import type Customer from "../../types/Customer";
import RevenuTable from "../../components/revenu/revenuTable";
import CryptoTable from "../../components/crypto/cryptoTable.vue";
import Weather from "../../components/general/weather.vue";
import { useRouter } from "vue-router";
import { ref, onUnmounted } from 'vue'
import { useCustomerStore } from "../../store/customerStore.ts";

const customerStore = useCustomerStore();
const { compute, filterAll, query } = useFilter(customerStore, "customers");
const { pages, items } = compute;
const { deleteItem } = useDelete(customerStore);
const itemName = "Customers";
const router = useRouter();
const searchFrom = ref(null);

filterAll(itemName);

function returnUnpaidInvoiceTotal(customer: Customer) {
  if (customer.Invoices) {
    return customer.Invoices.filter((invoice) => !invoice.paid).reduce((sum, invoice) => sum + invoice.total, 0);
  }
}

function resetAll() {
  searchFrom.value.reset()
  filterAll(itemName, true)
}

function pushToShow(customer: Customer) {
  if (customer.id) router.push({ path: `/customers/edit/${customer.id}`});
}

onUnmounted(() => {
  items.value = null;
})
</script>
