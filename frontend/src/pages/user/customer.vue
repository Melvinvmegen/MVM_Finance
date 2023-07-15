<template lang="pug">
v-col(cols="12" lg="11")
  v-row(justify="center")
    v-col(cols="12" md="9")
      template(v-if='initialCustomer.id')
        invoice-table(:customer-id='initialCustomer.id')
        .mt-4
        quotation-table(:customer-id='initialCustomer.id')
    v-col(cols="12" md="3")
      Suspense
        customer-form(v-if="props.id && initialCustomer.id || !props.id" :initial-customer='initialCustomer')
</template>

<script setup lang="ts">
import type { Customers } from "../../../types/models";

const props = defineProps({
  id: {
    type: [Number, String],
    required: true,
  },
});
const customerStore = useCustomerStore();
const indexStore = useIndexStore();
const initialCustomer = ref<Customers | any>({});

onBeforeMount(async () => {
  if (props.id) {
    indexStore.setLoading(true);
    const customer = customerStore.customers.find((customer) => customer.id == props.id);
    if (customer) {
      initialCustomer.value = customer;
      indexStore.setLoading(false);
    } else {
      const res = await customerStore.getCustomer(props.id);
      initialCustomer.value = res;
      indexStore.setLoading(false);
    }
  }
});
</script>
