<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row(align="center")
    v-col(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.lastname")' name='by_name' v-model.trim='query.last_name' @blur='filterCustomers')

    v-col(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.email")' name='by_email' v-model.trim='query.email' @blur='filterCustomers')

    v-col.mr-2(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.phone")' name='by_phone' v-model.trim='query.phone' @blur='filterCustomers')

    v-row(align="center" class="ml-2")
      v-btn.bg-secondary {{ $t("customers.search") }}
      v-icon.ml-2(@click="resetAll()") mdi-restore

v-col(cols="12")
  v-data-table-server(
    :headers="dataTable.headers"
    :items-length="props.items?.count"
    :items="props.items?.rows"
    :items-per-page="dataTable.perPage"
    :loading="loadingStore.loading"
    @update:options="getCustomers"
    item-value="name"
    )
    template( v-slot:[`item.revenus`]="{ item }")
      span {{ $n(returnPaidInvoiceTotal(item), "currency") }}
    template( v-slot:[`item.unpaid_amount`]="{ item }")
      span {{ $n(returnUnpaidInvoiceTotal(item), "currency") }}
    template( v-slot:[`item.vat_collected`]="{ item }")
      span {{ $n(returnTvaAmount(item), "currency") }}
    template(v-slot:item.actions="{ item }")
      v-row.flex-nowrap(align="center")
        v-btn(icon="mdi-pencil" variant="plain" size="small" :to="`/customers/${item.id}`")
        v-btn(icon="mdi-delete" variant="plain" size="small" @click.stop="deleteItem(item, $t('customers.confirmDelete', [`${item.first_name} ${item.last_name}`]) )")
</template>

<script setup lang="ts">
import { deleteCustomer } from "../utils/generated/api-user";
import type { customer, invoice, Query } from "../../types/models";

type CustomerWithInvoices = customer & { invoices: invoice[] };
const loadingStore = useLoadingStore();
const props = defineProps<{
  items: {
    rows: Array<CustomerWithInvoices>;
    count: number;
  };
}>();
const searchFrom = ref<HTMLFormElement | null>(null);
const { t: $t } = useI18n();
const route = useRoute();
const dataTable = {
  page: Number(route.query.currentPage) || 1,
  perPage: Number(route.query.perPage) || 12,
  sortBy: [],
  headers: [
    {
      key: "last_name",
      value: "last_name",
      title: $t("customers.lastname"),
    },
    {
      key: "first_name",
      value: "first_name",
      title: $t("customers.firstname"),
    },
    {
      key: "email",
      value: "email",
      title: $t("customers.email"),
    },
    {
      key: "phone",
      value: "phone",
      title: $t("customers.phone"),
    },
    {
      key: "revenus",
      value: "revenus",
      title: $t("customers.revenus"),
      sortable: false,
    },
    {
      key: "unpaid_amount",
      value: "unpaid_amount",
      title: $t("customers.unpaidAmount"),
      sortable: false,
    },
    {
      key: "vat_collected",
      value: "vat_collected",
      title: $t("customers.vatCollected"),
      sortable: false,
    },
    {
      key: "actions",
      value: "actions",
      sortable: false,
      width: 100,
    },
  ],
};

const emit = defineEmits(["filter"]);
function getCustomers({ page, itemsPerPage, sortBy }) {
  emit("filter", {
    currentPage: page,
    perPage: itemsPerPage,
    force: true,
    sortBy,
  });
}

const query = ref<Query>({});
function filterCustomers() {
  emit("filter", {
    ...query.value,
    force: true,
  });
}

function resetAll() {
  searchFrom?.value?.reset();
  query.value = {};
  filterCustomers();
}

function returnUnpaidInvoiceTotal(customer: CustomerWithInvoices) {
  if (customer.invoices) {
    return customer.invoices.filter((invoice) => !invoice.paid).reduce(
      (sum, invoice) => sum + (invoice.total_ttc || invoice.total),
      0,
    );
  }
}

function returnPaidInvoiceTotal(customer: CustomerWithInvoices) {
  if (customer.invoices) {
    return customer.invoices.filter((invoice) => invoice.paid).reduce(
      (sum, invoice) => sum + (invoice.total_ttc || invoice.total),
      0,
    );
  }
}

function returnTvaAmount(customer: CustomerWithInvoices) {
  if (customer.invoices) {
    return customer.invoices.filter((invoice) => invoice.paid).reduce((sum, invoice) => sum + invoice.tva_amount, 0);
  }
}

const { deleteItem } = useDelete(deleteCustomer);
</script>
