<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row
    v-col(cols="12" sm="3" md="2")
      v-text-field(variant="outlined" density="compact" hide-details label='Nom' name='by_name' v-model='query.lastName' @blur='filterAll(itemName, true)')

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
        td {{ returnPaidInvoiceTotal(customer) }}
        td {{ returnUnpaidInvoiceTotal(customer) }}
        td {{ returnTvaAmount(customer) }}
        td
          v-btn(color='red' variant="text" icon="mdi-delete" @click.stop="deleteItem(customer, 'Customer', `Vous êtes sur de vouloir supprimer la customer ${customer.firstName} ${customer.lastName}` )" :key='customer.id')

v-pagination(v-model="query.currentPage" :total-visible='query.perPage' :length='pages')
</template>

<script setup lang="ts">
import type { Customers, Invoices } from "../../../types/models";
type CustomerWithInvoices = Customers & { Invoices: Invoices[] };
const customerStore = useCustomerStore();
const { compute, filterAll, query } = useFilter(customerStore, "customers");
const { pages, items } = compute;
const { deleteItem } = useDelete(customerStore);
const itemName = "Customers";
const router = useRouter();
const searchFrom = ref(null);

filterAll(itemName);

function returnUnpaidInvoiceTotal(customer: CustomerWithInvoices) {
  if (customer.Invoices) {
    return customer.Invoices.filter((invoice) => !invoice.paid).reduce(
      (sum, invoice) => sum + (invoice.totalTTC || invoice.total),
      0,
    );
  }
}

function returnPaidInvoiceTotal(customer: CustomerWithInvoices) {
  if (customer.Invoices) {
    return customer.Invoices.filter((invoice) => invoice.paid).reduce(
      (sum, invoice) => sum + (invoice.totalTTC || invoice.total),
      0,
    );
  }
}

function returnTvaAmount(customer: CustomerWithInvoices) {
  if (customer.Invoices) {
    return customer.Invoices.filter((invoice) => invoice.paid).reduce((sum, invoice) => sum + invoice.tvaAmount, 0);
  }
}

function resetAll() {
  searchFrom?.value?.reset();
  filterAll(itemName, true);
}

function pushToShow(customer: Customers) {
  if (customer.id) router.push({ path: `/customers/edit/${customer.id}` });
}
</script>