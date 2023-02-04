<template lang="pug">
v-card
  v-form(@submit.prevent="handleSubmit")
    v-card-title {{ props.initialCustomer?.id ? "Editer un client" : "Créer un client" }}
    v-card-text
      v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='firstName' label='Prénom' density="compact" v-model="mutableCustomer.firstName" type='text' variant="outlined")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='lastName' label='Nom' density="compact" v-model="mutableCustomer.lastName" type='text' variant="outlined")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='email' label='Email' density="compact" v-model="mutableCustomer.email" type='text' variant="outlined")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='phone' label='Téléphone' density="compact" v-model="mutableCustomer.phone" type='text' variant="outlined")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='company' label='Entreprise' density="compact" v-model="mutableCustomer.company" type='text' variant="outlined")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='address' label='Adresse' density="compact" v-model="mutableCustomer.address" type='text' variant="outlined")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='city' label='Ville' density="compact" v-model="mutableCustomer.city" type='text' variant="outlined")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='siret' label='Siret' density="compact" v-model="mutableCustomer.siret" type='text' variant="outlined")

    v-card-actions
      v-row(dense justify="center")
        v-col.d-flex.justify-center(cols="12" lg="8")
          v-btn.bg-secondary.text-white(type="submit") {{ props.initialCustomer?.id ? "Editer un client" : "Créer un client" }}
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { PropType } from "vue";
import type Customer from "../types/Customer";
import { useIndexStore } from "../../store/indexStore";
import { useCustomerStore } from "../../store/customerStore";
import { useRouter } from "vue-router";

const props = defineProps({
  initialCustomer: {
    type: Object as PropType<Customer>,
    required: true,
  },
});
const router = useRouter();
const customerStore = useCustomerStore();
const indexStore = useIndexStore();
let mutableCustomer = ref<Customer>({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  siret: "",
});

if (Object.entries(props.initialCustomer).length) {
  mutableCustomer.value = { ...props.initialCustomer };
}

async function handleSubmit(): Promise<void> {
  indexStore.setLoading(true);
  const action = props.initialCustomer?.id ? "updateCustomer" : "createCustomer";
  if (!mutableCustomer.value.createdAt) mutableCustomer.value.createdAt = new Date();
  mutableCustomer.value.updatedAt = new Date();
  try {
    const res = await customerStore[action](mutableCustomer.value);
    if (res && !mutableCustomer.value.id) {
      router.push(`/customers`);
    }
  } finally {
    indexStore.setLoading(false);
  }
}
</script>
