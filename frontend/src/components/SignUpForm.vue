<template lang="pug">
v-form(@submit.prevent="handleSubmit" key="signUp")
  v-card-text
    v-alert(color="danger"  v-if='indexStore.error') {{ indexStore.error }}
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='firstname' label='firstname' v-model="user.firstname" :rules="[$v.required()]"  )
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='lastname' label='lastname' v-model="user.lastname"  :rules="[$v.required()]")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='email' label='email' v-model="user.email"  :rules="[$v.required(), $v.isEmail()]")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='password' label='password' v-model="user.password" type='password' :rules="[$v.required()]")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='confirmPassword' label='confirmPassword' v-model="user.confirmPassword" type='password' :rules="[$v.required(), $v.passwordMatch(user.password)]")
  v-card-actions
    v-row(dense justify="center")
      v-col.d-flex.justify-center(cols="12" md="8")
        v-btn.bg-secondary.text-white(type="submit") Créer un compte
</template>

<script setup lang="ts">
const indexStore = useIndexStore();
const user = reactive({
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: "",
});
const emit = defineEmits(["submit"]);

async function handleSubmit(): Promise<void> {
  emit("submit", user);
}
</script>
