<template lang="pug">
v-form(@submit.prevent="handleSubmit" key="signUp")
  v-card-text
    v-alert(color="danger" variant="outlined" v-if='indexStore.error') {{ indexStore.error }}
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#firstname(name='firstname' label='firstname' density="comfortable" v-model="user.firstname" type='text' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#lastname(name='lastname' label='lastname' density="comfortable" v-model="user.lastname" type='text' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#email(name='email' label='email' density="comfortable" v-model="user.email" type='text' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#password(name='password' label='password' density="comfortable" v-model="user.password" type='password' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#confirmPassword(name='confirmPassword' label='confirmPassword' density="comfortable" v-model="user.confirmPassword" type='password' variant="outlined")
  v-card-actions
    v-row(dense justify="center")
      v-col.d-flex.justify-center(cols="12" md="8")
        v-btn.bg-secondary.text-white(type="submit") Créer un compte
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useIndexStore } from "../../store/indexStore";

const indexStore = useIndexStore();
const user = reactive({
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: ""
});
const emit = defineEmits(["submit"]);

async function handleSubmit(): Promise<void> {
  emit("submit", user);
}
</script>
