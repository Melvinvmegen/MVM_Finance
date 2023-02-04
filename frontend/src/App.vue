<template lang="pug">
v-app
  v-snackbar.mt-5(v-for='(message, index) in indexStore.error' :key='index' :color="message.type || 'info'" value='message.message' top='' :timeout='message.timeout || 7000')
    | {{ message.message }}
  v-overlay.align-center.justify-center(:model-value='indexStore.loading' opacity='0.7')
    v-progress-circular(indeterminate color='secondary' size='64')
    
  router-view(v-slot="{ Component }")
    transition(name='slide-fade' mode='out-in')
      Component(:is="Component")

  v-footer.pa-0(app bottom absolute color='primary' width='100%')
    v-card.text-center(elevation='0' rounded='0' color='primary' width='100%')
      v-divider(color='white')
      v-card-text.text-white
        | {{ new Date().getFullYear() }} &mdash; 
        strong MVM
</template>

<script setup lang="ts">
import { useIndexStore } from "./store/indexStore";

const indexStore = useIndexStore();
</script>

<style>
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.slide-fade-enter-active {
  transition: all 0.5s ease-out;
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.5s ease-in;
}

a { text-decoration: none; }
</style>

