<template lang="pug">
v-app
  v-snackbar.mt-5(v-for="(message, index) in messageStore.messages"
    :key="index"
    :color="message.type || 'info'"
    location="top"
    :model-value="true"
    :timeout="message.timeout || 7000"
    class="mt-14")
    | {{ message.key ? $t(message.key, [...(message.params || [])]) : message.message }}
  v-overlay.align-center.justify-center(
    :model-value="loadingStore.loading"
    opacity="0.8"
    z-index="1010"
    class="d-flex justify-center align-center")
    v-progress-circular(indeterminate color="primary" size="48" class="mb-16")
    
  router-view(v-slot="{ Component }")
    transition(name='slide-fade' mode='out-in')
      Component(:is="Component")

  v-footer.pa-0(app bottom absolute color='primary' width='100%')
    v-card.text-center(elevation='0' rounded='0' color='primary' width='100%')
      v-divider(color='white')
      v-card-text.text-white
        | {{ dayjs().year() }} &mdash; 
        strong MVM
</template>

<script setup lang="ts">
import dayjs from "dayjs";
const loadingStore = useLoadingStore();
const messageStore = useMessageStore();

onBeforeMount(() => (document.documentElement.style.opacity = "1"));
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

a {
  text-decoration: none;
}
</style>
