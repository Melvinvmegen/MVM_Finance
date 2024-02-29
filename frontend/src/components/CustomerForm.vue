<template lang="pug">
v-card
  v-form(v-model="valid" @submit.prevent="handleSubmit")
    v-card-title.mb-4.text-center {{ props.initialCustomer?.id ? $t("customers.editCustomer") : $t("customers.createCustomer") }}
    v-card-text
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.firstname")' v-model="mutable_customer.first_name" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.lastname")' v-model="mutable_customer.last_name" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.email")' v-model="mutable_customer.email" :rules="[$v.required(), $v.isEmail()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.phone")' v-model="mutable_customer.phone")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.company")' v-model="mutable_customer.company")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.address")' v-model="mutable_customer.address")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.city")' v-model="mutable_customer.city")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.siret")' v-model="mutable_customer.siret")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(:label='$t("customers.vatNumber")' v-model="mutable_customer.vat_number")

    v-card-actions
      v-row(dense justify="center")
        v-col.d-flex.justify-center(cols="12" lg="8")
          v-btn.bg-secondary.text-white(type="submit") {{ props.initialCustomer?.id ? $t("customers.editCustomer") : $t("customers.createCustomer") }}
</template>

<script setup lang="ts">
import type { customer, Prisma } from "../../types/models";
import { createCustomer, updateCustomer } from "../utils/generated/api-user";
const props = defineProps({
  initialCustomer: {
    type: Object as PropType<customer>,
  },
});
const loadingStore = useLoadingStore();
const valid = ref(false);
let mutable_customer = ref<Prisma.customerUncheckedCreateInput>({
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  siret: "",
  vat_number: "",
  stripe_id: null,
  user_id: null,
});

if (props.initialCustomer) {
  mutable_customer.value = { ...props.initialCustomer };
}

async function handleSubmit(): Promise<void> {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  try {
    if (props.initialCustomer?.id) {
      await updateCustomer(mutable_customer.value.id, mutable_customer.value);
      useMessageStore().i18nMessage("success", "customers.updated");
    } else {
      const newCustomer = await createCustomer(mutable_customer.value);
      window.location.pathname = `/customers/${newCustomer.id}`;
    }
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
