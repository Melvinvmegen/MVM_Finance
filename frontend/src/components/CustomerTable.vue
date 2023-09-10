<template lang="pug">
v-form(@submit.prevent ref="searchFrom")
  v-row(align="center")
    v-col(cols="12" sm="3" md="2")
      v-text-field(hide-details :label='$t("customers.lastname")' name='by_name' v-model.trim='query.lastName' @blur='filterCustomers')

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
      span {{ $n(returnPaidInvoiceTotal(item.raw), "currency") }}
    template( v-slot:[`item.unpaidAmount`]="{ item }")
      span {{ $n(returnUnpaidInvoiceTotal(item.raw), "currency") }}
    template( v-slot:[`item.vatCollected`]="{ item }")
      span {{ $n(returnTvaAmount(item.raw), "currency") }}
    template(v-slot:item.actions="{ item }")
      v-row(align="center")
        v-btn(icon="mdi-pencil" variant="plain" size="small" :to="`/customers/${item.raw.id}`")
        v-btn(icon="mdi-delete" variant="plain" size="small" @click.stop="deleteItem(item.raw, $t('customers.confirmDelete', [`${item.raw.firstName} ${item.raw.lastName}`]) )")
</template>

<script setup lang="ts">
import { deleteCustomer } from "../utils/generated/api-user";
import type { Customers, Invoices, Query } from "../../types/models";

type CustomerWithInvoices = Customers & { Invoices: Invoices[] };
const loadingStore = useLoadingStore();
const props = defineProps<{
  items: {
    rows: Array<CustomerWithInvoices>;
    count: number;
  };
}>();
const searchFrom = ref<HTMLFormElement | null>(null);
const { t: $t } = useI18n();
const dataTable = {
  perPage: 12,
  headers: [
    {
      key: "lastName",
      value: "lastName",
      title: $t("customers.lastname"),
    },
    {
      key: "firstName",
      value: "firstName",
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
      key: "unpaidAmount",
      value: "unpaidAmount",
      title: $t("customers.unpaidAmount"),
      sortable: false,
    },
    {
      key: "vatCollected",
      value: "vatCollected",
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

const { deleteItem } = useDelete(deleteCustomer);
</script>
