<template lang="pug">
v-form(@submit.prevent="handleSubmit" key="signIn")
  v-alert(type="error" prominent  class='mb-4' v-if='indexStore.error') {{ indexStore.error }}
  v-card-text
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='email' :label='$t("auth.signIn.email")' v-model="user.email" :rules="[$v.required(), $v.isEmail()]")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='password' :label='$t("auth.signIn.password")' v-model="user.password" type='password' :rules="[$v.required()]")
  v-card-actions
    v-row(dense justify="center")
      v-col.d-flex.justify-center(cols="12" md="8")
        v-btn.bg-secondary.text-white(type="submit")  {{ $t("auth.signIn.submit") }}

</template>

<script setup lang="ts">
const indexStore = useIndexStore();
const user = reactive({
  email: "",
  password: "",
});
const emit = defineEmits(["submit"]);

async function handleSubmit(): Promise<void> {
  emit("submit", user);
}
</script>
