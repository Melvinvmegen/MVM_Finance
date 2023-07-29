<template lang="pug">
v-col(cols="12" lg="11")
  v-row(justify="center")
    v-col(cols="12" md="9")
      template(v-if='initialCustomer.id')
        InvoiceTable(:customer-id='initialCustomer.id')
        .mt-4
        QuotationTable(:customer-id='initialCustomer.id')
    v-col(cols="12" md="3")
      Suspense
        CustomerForm(v-if="props.id && initialCustomer.id || !props.id" :initial-customer='initialCustomer')
</template>

<script setup lang="ts">
import { getCustomer } from "../../utils/generated/api-user";
import type { Customers } from "../../../types/models";

const router = useRouter();
const props = defineProps({
  id: {
    type: [Number, String],
    required: true,
  },
});
const loadingStore = useLoadingStore();
const initialCustomer = ref<Customers | any>({});

onBeforeMount(async () => {
  if (props.id) {
    loadingStore.setLoading(true);
    initialCustomer.value = await getCustomer(props.id);
    loadingStore.setLoading(false);
  } else {
    router.push("/customers");
  }
});
</script>
