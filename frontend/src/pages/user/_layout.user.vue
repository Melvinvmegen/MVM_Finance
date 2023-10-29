<template lang="pug">
v-app
  v-app-bar(color='primary' fixed)
    v-app-bar-nav-icon(v-if="currentUser" variant="text" @click.stop="drawer = !drawer")
    v-app-bar-title {{ $t("common.brand") }}
    v-spacer
    v-menu(offset-y)
      template(v-slot:activator='{}')
        v-btn(icon="mdi-power" to='/logout' v-if='currentUser')
        router-link.text-decoration-none(:to="'/login'" color='white' v-else)
          v-btn(icon="mdi-account" color='white')
  v-navigation-drawer(v-model="drawer" :permanent='!display.mobile.value' width='300' v-if="currentUser")
    v-list(class="pt-0")
      div(v-for='item in menuItems' :key='item.title')
        v-list-item(v-if="item.active" color="secondary" lines="two" density="comfortable" :to='`/${item.link}`')
          template(v-slot:prepend)
            v-icon(:icon="item.icon")
          v-list-item-title(v-text="item.title")

  v-main
    v-container.px-2.pb-5
      v-row(justify='center' dense)
        v-col.page-container(cols='12' xl='11')
          router-view(v-slot='{ Component }')
            v-fade-transition(mode='out-in')
              component(:is='Component')
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";
const display = useDisplay();
const authStore = useAuthStore();
const currentUser = computed(() => authStore.me);
const drawer = ref(false);
const menuItems = [
  { title: "Dashboard", link: "dashboard", icon: "mdi-view-dashboard", active: true },
  { title: "Revenus", link: "revenus", icon: "mdi-currency-eur", active: currentUser?.value?.revenusModuleActive },
  {
    title: "Customers",
    link: "customers",
    icon: "mdi-account-group-outline",
    active: currentUser?.value?.customersModuleActive,
  },
  { title: "Cryptos", link: "cryptos", icon: "mdi-currency-btc", active: currentUser?.value?.cryptosModuleActive },
];
</script>
