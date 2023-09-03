<template lang="pug">
v-row(justify='center' align="center" dense class="fill-height")
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
    a.text-decoration-underline.d-flex.justify-center.mx-8(@click='changeMode') {{ isSignIn ? $t("auth.signUp.submit") : $t("auth.signIn.submit") }}
</template>

<script setup lang="ts">
import type { Users } from "../../../types/models";
import { signUp, signIn } from "../../utils/generated/api-public";

const loadingStore = useLoadingStore();
const authStore = useAuthStore();
const router = useRouter();
const isSignIn = ref(true);
const loggedIn = computed(() => authStore.me);

if (loggedIn.value) {
  router.push("/dashboard");
}

async function handleSubmit(user: Users): Promise<void> {
  loadingStore.setLoading(true);
  try {
    if (isSignIn.value) {
      await signIn(user);
      window.location.href = `${window.location.origin}/dashboard`;
    } else {
      await signUp(user);
      isSignIn.value = true;
    }
  } finally {
    loadingStore.setLoading(false);
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
