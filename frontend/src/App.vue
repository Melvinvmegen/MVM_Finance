<template lang="pug">
v-app
  v-snackbar.mt-5(v-for='(message, index) in indexStore.error' :key='index' :color="message.type || 'info'" value='message.message' top='' :timeout='message.timeout || 7000')
    | {{ message.message }}
    v-icon(color='white' v-if='message.reactionAddons') {{ message.reactionAddons.type }}
  v-overlay.align-center.justify-center(:model-value='indexStore.loading' opacity='0.7')
    v-progress-circular(indeterminate color='secondary' size='64')
    
  router-view(v-slot="{ Component }")
    transition(name='slide-fade' mode='out-in')
      Component(:is="Component")

  v-footer.pa-0(app bottom absolute color='primary' width='100%' :height="display.mobile.value ? '80px' : '130px'")
    v-card.text-center(elevation='0' rounded='0' color='primary' width='100%')
      v-card-text 
        v-row(justify='center')
          v-btn.mx-4(icon='mdi-home' variant='text' color="secondary")
          v-btn.mx-4(icon='mdi-email' variant='text' color="secondary")
          v-btn.mx-4(icon='mdi-calendar' variant='text' color="secondary")
      v-divider(color='white')
      v-card-text.text-white
        | {{ new Date().getFullYear() }} &mdash; 
        strong MVM
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify';
import { useIndexStore } from "./store/indexStore.ts";

const indexStore = useIndexStore();
const display = useDisplay();
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

