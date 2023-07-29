<template lang="pug">
v-card
  v-form(@submit.prevent="handleSubmit")
    v-card-title {{ props.initialCustomer?.id ? $t("customers.editCustomer") : $t("customers.createCustomer") }}
    v-card-text
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='firstName' :label='$t("customers.firstname")' v-model="mutableCustomer.firstName" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='lastName' :label='$t("customers.lastname")' v-model="mutableCustomer.lastName" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='email' :label='$t("customers.email")' v-model="mutableCustomer.email" :rules="[$v.required(), $v.isEmail()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='phone' :label='$t("customers.phone")' v-model="mutableCustomer.phone")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='company' :label='$t("customers.company")' v-model="mutableCustomer.company" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='address' :label='$t("customers.address")' v-model="mutableCustomer.address")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='city' :label='$t("customers.city")' v-model="mutableCustomer.city")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='siret' :label='$t("customers.siret")' v-model="mutableCustomer.siret")

    v-card-actions
      v-row(dense justify="center")
        v-col.d-flex.justify-center(cols="12" lg="8")
          v-btn.bg-secondary.text-white(type="submit") {{ props.initialCustomer?.id ? $t("customers.editCustomer") : $t("customers.createCustomer") }}
</template>

<script setup lang="ts">
import type { Customers } from "../../types/models";
import { createCustomer, updateCustomer } from "../utils/generated/api-user";
const props = defineProps({
  initialCustomer: {
    type: Object as PropType<Customers>,
    required: true,
  },
});
const router = useRouter();
const loadingStore = useLoadingStore();
let mutableCustomer = ref<Customers>({
  id: 1,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  siret: "",
  createdAt: new Date(),
  updatedAt: new Date(),
  stripeId: null,
  UserId: null,
});

if (Object.entries(props.initialCustomer).length) {
  mutableCustomer.value = { ...props.initialCustomer };
}

async function handleSubmit(): Promise<void> {
  loadingStore.setLoading(true);
  try {
    if (props.initialCustomer?.id) {
      updateCustomer(mutableCustomer.value);
    } else {
      createCustomer(mutableCustomer.value);
    }
    router.push(`/customers`);
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
