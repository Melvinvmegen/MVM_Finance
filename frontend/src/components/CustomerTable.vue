<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row
    v-col(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.fullName")' name='by_name' v-model='query.lastName' @blur='filterAll(true)')

    v-col(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.email")' name='by_email' v-model='query.email' @blur='filterAll(true)')

    v-col(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.city")' name='by_city' v-model='query.city' @blur='filterAll(true)')

    v-col.mr-2(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.phone")' name='by_phone' v-model='query.phone' @blur='filterAll(true)')

    v-row(align="center")
      v-btn.bg-secondary Rechercher
      v-icon.ml-2(@click="resetAll()") mdi-restore

v-col(cols="12")
  v-table
    thead
      tr
        th.text-left
          | {{ $t("customers.lastname") }}
        th.text-left
          | {{ $t("customers.firstname") }}
        th.text-left
          | {{ $t("customers.email") }}
        th.text-left
          | {{ $t("customers.phone") }}
        th.text-left
          | {{ $t("customers.revenus") }}
        th.text-left
          | {{ $t("customers.unpaidAmount") }}
        th.text-left
          | {{ $t("customers.vatCollected") }}
        th.text-left
          | {{ $t("customers.actions") }}
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
          v-btn(color='red' variant="text" icon="mdi-delete" @click.stop="deleteItem(customer, 'Customer', $t('customers.confirmDelete', [`${customer.firstName} ${customer.lastName}`]) )" :key='customer.id')

v-pagination(v-model="query.currentPage" :total-visible='query.perPage' :length='pages')
</template>

<script setup lang="ts">
import { getCustomers, deleteCustomer } from "../utils/generated/api-user";
import type { Customers, Invoices } from "../../types/models";
type CustomerWithInvoices = Customers & { Invoices: Invoices[] };
const { compute, filterAll, query } = useFilter([], () => getCustomers);
const { pages, items } = compute;
const { deleteItem } = useDelete(() => deleteCustomer);
const router = useRouter();
const searchFrom = ref(null);

filterAll();

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
  filterAll(true);
}

function pushToShow(customer: Customers) {
  if (customer.id) router.push({ path: `/customers/edit/${customer.id}` });
}
</script>
