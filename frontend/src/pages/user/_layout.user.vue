<template lang="pug">
v-app
  v-app-bar(color='primary' fixed)
    v-app-bar-title  MVM
    v-spacer
    v-menu(offset-y)
      template(v-slot:activator='{}')
        v-btn(icon="mdi-power" @click='logOut' v-if='currentUser')
        router-link.text-decoration-none(:to="'/login'" color='white' v-else)
          v-btn(icon="mdi-account" color='white')
  v-navigation-drawer(:permanent='!display.mobile.value' width='300' v-if="currentUser")
    v-list
      div(v-for='item in menuItems' :key='item.title')
        v-list-item(v-if="item.active" active-color="secondary" dense :to='`/${item.link}`')
          template(v-slot:prepend)
            v-icon(:icon="item.icon")
          v-list-item-title(v-text="item.title")

  v-main
    v-container.pt-0(fluid)
      router-view( v-slot="{ Component }")
        transition(name='slide-fade' mode='out-in')
          Component(:is="Component")
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed } from "vue";
import { useUserStore } from "../../store/userStore";
import { useDisplay } from "vuetify";

const display = useDisplay();
const userStore = useUserStore();
const router = useRouter();
const currentUser = computed(() => userStore.auth);

const menuItems = [
  { title: "Dashboard", link: "dashboard", icon: "mdi-view-dashboard", active: true },
  { title: "Revenus", link: "revenus", icon: "mdi-currency-eur", active: currentUser?.value?.revenusModuleActive },
  { title: "Customers", link: "customers", icon: "mdi-account-group-outline", active: currentUser?.value?.customersModuleActive },
  { title: "Cryptos", link: "cryptos", icon: "mdi-currency-btc", active: currentUser?.value?.cryptosModuleActive},
];

function logOut() {
  userStore.logout();
  router.push("/login");
}
</script>
