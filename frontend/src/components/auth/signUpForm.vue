<template lang="pug">
v-form(@submit.prevent="handleSubmit" key="signUp")
  v-card-text
    v-alert(color="danger" variant="outlined" v-if='indexStore.error') {{ indexStore.error }}
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#firstname(name='firstname' label='firstname' density="comfortable" v-model="firstname" type='text' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#lastname(name='lastname' label='lastname' density="comfortable" v-model="lastname" type='text' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#email(name='email' label='email' density="comfortable" v-model="email" type='text' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#password(name='password' label='password' density="comfortable" v-model="password" type='password' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#confirmPassword(name='confirmPassword' label='confirmPassword' density="comfortable" v-model="confirmPassword" type='password' variant="outlined")
  v-card-actions
    v-row(dense justify="center")
      v-col.d-flex.justify-center(cols="12" md="8")
        v-btn.bg-secondary.text-white(type="submit") Créer un compte
</template>

<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import axios from "axios";

const firstname = ref("");
const lastname = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const emit = defineEmits(["submit"]);

async function handleSubmit(user: any): Promise<void> {
  emit("submit", { firstname, lastname, email, password });
}
</script>
