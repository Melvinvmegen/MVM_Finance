<template lang="pug">
v-container(:class="display.mobile.value ? 'pt-0' : 'pa-0'")
  v-row(justify='center')
    v-col(cols='12' md='9' lg='7' xl='4')
      v-card.elevation-12.mt-5
        v-row.pa-md-5(justify='center')
          v-col(cols='12')
            v-card-title.font-weight-regular.text-h4 {{ isSignIn ? $t("auth.signIn.title") : $t("auth.signUp.title") }}
            v-card-subtitle {{ isSignIn ? $t("auth.signIn.subtitle") : $t("auth.signUp.subtitle") }}
            v-divider.my-7
            transition(name="switch" mode="out-in")
              sign-in-form(@submit="handleSubmit" v-if='isSignIn')
              sign-up-form(@submit="handleSubmit" v-else)
      br
      span
        u.text-underline.d-flex.justify-center.mx-8(@click='changeMode') {{ isSignIn ? $t("auth.signIn.submit") : $t("auth.signUp.submit") }}
</template>

<script setup lang="ts">
import { signUp, signIn } from "../../utils/generated/api-public";

const indexStore = useIndexStore();
const userStore = useUserStore();
const router = useRouter();
const display = useDisplay();
const isSignIn = ref(true);
const loggedIn = computed(() => userStore.auth);

if (loggedIn.value) {
  router.push("/dashboard");
}

async function handleSubmit(user: any): Promise<void> {
  indexStore.setLoading(true);
  try {
    if (!isSignIn.value) await signUp(user);
    const auth = await signIn(user);
    await userStore.signIn(auth);
    window.location.href = `${window.location.origin}/dashboard`;
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
