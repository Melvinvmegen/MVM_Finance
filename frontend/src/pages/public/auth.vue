<template lang="pug">
v-container(:class="display.mobile.value ? 'pt-0' : 'pa-0'")
  v-row(justify='center')
    v-col(cols='12' md='9' lg='7' xl='4')
      v-card.elevation-12.mt-5
        v-row.pa-md-5(justify='center')
          v-col(cols='12')
            v-card-title.font-weight-regular.text-h4 {{ isSignIn ? "Se connecter" : "S'inscrire" }}
            v-card-subtitle {{ isSignIn ? "Pour accéder à mon tableau de bord" : "Pour créer mon tableau de bord" }}
            v-divider.my-7
            transition(name="switch" mode="out-in")
              sign-in-form(@submit="handleSubmit" v-if='isSignIn')
              sign-up-form(@submit="handleSubmit" v-else)
      //- br
      //- span
      //-   u.text-underline.d-flex.justify-center.mx-8(@click='changeMode') {{ isSignIn ? "Je créé un compte" : "J'ai déjà un compte"}}
</template>

<script setup lang="ts">
import AuthService from "../../services/authService";
import { computed, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import axios from "axios";
import SignInForm from "../../components/auth/signInForm";
import SignUpForm from "../../components/auth/signUpForm";
import { useIndexStore } from "../../store/indexStore.ts";
import { useUserStore } from "../../store/userStore.ts";

const indexStore = useIndexStore();
const userStore = useUserStore();
const router = useRouter();
const display = useDisplay();
const isSignIn = ref(true);
const loggedIn = computed(() => userStore.auth);

if (loggedIn.value) {
  router.push("/customers");
}

async function handleSubmit(user: any): Promise<void> {
  indexStore.setLoading(true);
  const action = isSignIn.value ? "signIn" : "signUp";
  try {
    
    const auth = await AuthService.signIn(user);
    const res = await userStore[action](auth);
    if (isSignIn.value) router.push("/customers");
    isSignIn.value = true;
  } finally {
    indexStore.setLoading(false);
  }
}

function changeMode(): void {
  isSignIn.value = !isSignIn.value;
}
</script>

<style>
.switch-enter-from,
.switch-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.switch-enter-active,
.switch-leave-active {
  transition: all 0.5s ease-in;
}
</style>
