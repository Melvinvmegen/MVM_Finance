<template lang="pug">
v-card
  v-form(@submit.prevent="handleSubmit")
    v-card-title {{ props.initialCustomer?.id ? "Editer un client" : "Créer un client" }}
    v-card-text
      v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='firstName' label='Prénom' v-model="mutableCustomer.firstName" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='lastName' label='Nom' v-model="mutableCustomer.lastName" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='email' label='Email' v-model="mutableCustomer.email" :rules="[$v.required(), $v.isEmail()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='phone' label='Téléphone' v-model="mutableCustomer.phone")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='company' label='Entreprise' v-model="mutableCustomer.company" :rules="[$v.required()]")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='address' label='Adresse' v-model="mutableCustomer.address")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='city' label='Ville' v-model="mutableCustomer.city")
      v-row(dense justify="center")
        v-col(cols="12")
          v-text-field(name='siret' label='Siret' v-model="mutableCustomer.siret")

    v-card-actions
      v-row(dense justify="center")
        v-col.d-flex.justify-center(cols="12" lg="8")
          v-btn.bg-secondary.text-white(type="submit") {{ props.initialCustomer?.id ? "Editer un client" : "Créer un client" }}
</template>

<script setup lang="ts">
const props = defineProps({
  initialCustomer: {
    type: Object as PropType<Customers>,
    required: true,
  },
});
const router = useRouter();
const customerStore = useCustomerStore();
const indexStore = useIndexStore();
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
