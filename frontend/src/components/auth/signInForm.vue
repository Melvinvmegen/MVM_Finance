<template lang="pug">
v-form(@submit.prevent="handleSubmit" key="signIn")
  v-alert(type="error" prominent variant="outlined" class='mb-4' v-if='indexStore.error') {{ indexStore.error }}
  v-card-text
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#email(name='email' label='email' density="comfortable" v-model="user.email" type='text' variant="outlined")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field#password(name='password' label='password' density="comfortable" v-model="user.password" type='password' variant="outlined")
  v-card-actions
    v-row(dense justify="center")
      v-col.d-flex.justify-center(cols="12" md="8")
        v-btn.bg-secondary.text-white(type="submit") Je me connecte

</template>

<script setup lang="ts">
import { computed, ref, reactive } from "vue";
import axios from "axios";
import { useIndexStore } from "../../store/indexStore.ts";

const indexStore = useIndexStore();
const user = reactive({
  email: "",
  password: ""
});
const emit = defineEmits(["submit"]);

async function handleSubmit(): Promise<void> {
  emit("submit", user);
}
</script>
