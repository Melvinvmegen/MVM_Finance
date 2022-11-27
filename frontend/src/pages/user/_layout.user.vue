<template lang="pug">
v-main
  v-app-bar(color='primary' app fixed)
    v-app-bar-title  MVM
    v-spacer
    v-menu(offset-y)
      template(v-slot:activator='{}')
        v-btn(icon="mdi-power" @click='logOut' v-if='currentUser')
        router-link.text-decoration-none(:to="'/login'" color='white' v-else)
          v-btn(icon="mdi-account" color='white')

  v-container.pt-0(fluid)
    router-view( v-slot="{ Component }")
      //- suspense(timeout="0")
      transition(name='slide-fade' mode='out-in')
        Component(:is="Component")
</template>

<script setup lang="ts">
import { onBeforeUnmount } from "@vue/runtime-core";
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useUserStore } from "../../store/userStore.ts";

const userStore = useUserStore();
const router = useRouter();
const currentUser = computed(() => userStore.auth);

function logOut() {
  userStore.logout();
  router.push("/login");
}
</script>
