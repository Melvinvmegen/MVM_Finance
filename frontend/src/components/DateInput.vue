<template>
  <div>
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-right="40"
      transition="scale-transition"
      offset-y
      min-width="290px"
    >
      <template v-slot:activator="{ props }">
        <v-text-field v-bind="props" :modelValue="dateFormatted" append-inner-icon="mdi-calendar"></v-text-field>
      </template>
      <v-date-picker :modelValue="getDate" @update:modelValue="updateDate"></v-date-picker>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  value: {
    type: String,
    default() {
      return new Date();
    },
  },
});
const menu = ref(false);
const input = ref(null);

watch(
  props.value,
  (newValue) => {
    input.value = newValue;
  },
  { immediate: true },
);

const dateFormatted = computed(() => {
  const date = input.value ? new Date(input.value) : new Date();
  let month = 1 + date.getMonth();
  if (month < 10) {
    month = `0${month}`;
  }
  let day = date.getDate();
  if (day < 10) {
    day = `0${day}`;
  }
  return [`${date.getFullYear()}-${month}-${day}`];
});

const getDate = computed(() => {
  let date = input.value ? new Date(input.value) : new Date();
  return [date];
});
function updateDate(val) {
  menu.value = false;
  input.value = val;
  console.error(val);
}
</script>
