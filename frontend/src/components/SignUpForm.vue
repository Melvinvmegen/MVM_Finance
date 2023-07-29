<template lang="pug">
v-form(@submit.prevent="handleSubmit" key="signUp")
  v-card-text
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='firstname' :label='$t("auth.signUp.firstname")' v-model="user.firstname" :rules="[$v.required()]"  )
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='lastname' :label='$t("auth.signUp.lastname")' v-model="user.lastname"  :rules="[$v.required()]")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='email' :label='$t("auth.signUp.email")' v-model="user.email"  :rules="[$v.required(), $v.isEmail()]")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='password' :label='$t("auth.signUp.password")' v-model="user.password" type='password' :rules="[$v.required()]")
    v-row(dense justify="center")
      v-col(cols="12" md="8")
        v-text-field(name='confirmPassword' :label='$t("auth.signUp.confirmPassword")' v-model="user.confirmPassword" type='password' :rules="[$v.required(), $v.passwordMatch(user.password)]")
  v-card-actions
    v-row(dense justify="center")
      v-col.d-flex.justify-center(cols="12" md="8")
        v-btn.bg-secondary.text-white(type="submit") {{ $t("auth.signUp.submit") }}
</template>

<script setup lang="ts">
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
