<template lang="pug">
v-col(cols="12" lg="11")
  v-row(justify="center")
    v-col(cols="12" md="9")
      template(v-if='initialCustomer.id')
        invoice-table(:customer-id='initialCustomer.id')
        .mt-4
        quotation-table(:customer-id='initialCustomer.id')
    v-col(cols="12" md="3")
      customer-form(:initial-customer='initialCustomer')
</template>

<script setup lang="ts">
import { ref } from "vue";
import type Customer from "../../types/Customer";
import customerForm from "../../components/customer/customerForm";
import InvoiceTable from "../../components/invoice/invoiceTable.vue";
import QuotationTable from "../../components/quotation/quotationTable.vue";
import { useCustomerStore } from "../../store/customerStore.ts";
import { useIndexStore } from "../../store/indexStore.ts";

const props = defineProps({
  id: {
    type: [Number, String],
    required: true,
  },
});
const customerStore = useCustomerStore();
const indexStore = useIndexStore();
const initialCustomer = ref<Customer | any>({});

if (props.id) {
  indexStore.setLoading(true);
  const customer = customerStore.customers.find(customer => customer.id == props.id);
  if (customer) {
    initialCustomer.value = customer;
    indexStore.setLoading(false);
  } else {
    customerStore.getCustomer(props.id).then((res) => {
      initialCustomer.value = res;
      indexStore.setLoading(false);
    });
  }
}
</script>
