<template lang="pug">
v-col(cols="12" lg="11")
  v-row(justify="center")
    v-col(v-if='initialCustomer?.id' cols="12" md="9")
      InvoiceTable(:customer-id='initialCustomer?.id')
      .mt-4
      QuotationTable(:customer-id='initialCustomer?.id')
    v-col(cols="12" :md="initialCustomer?.id ? 3 : 6")
      CustomerForm(v-if="route.params.customerId && initialCustomer || !route.params.customerId" :initial-customer='initialCustomer')
</template>

<script setup lang="ts">
import { getCustomer } from "../../utils/generated/api-user";
import type { Customers } from "../../../types/models";

const loadingStore = useLoadingStore();
const initialCustomer = ref<Customers>();
const route = useRoute();

onMounted(async () => {
  try {
    if (route.params.customerId) {
      loadingStore.setLoading(true);
      initialCustomer.value = await getCustomer(route.params.customerId);
    }
  } finally {
    loadingStore.setLoading(false);
  }
});
</script>
