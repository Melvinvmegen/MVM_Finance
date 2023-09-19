<template>
  <div>
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-right="40"
      transition="scale-transition"
      offset-y
      min-width="290px"
      location="end"
    >
      <template v-slot:activator="{ props }">
        <v-text-field v-bind="props" :modelValue="dateFormatted" append-inner-icon="mdi-calendar"></v-text-field>
      </template>
      <v-date-picker :modelValue="getDate" @update:modelValue="updateDate"></v-date-picker>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { VDatePicker } from "vuetify/labs/VDatePicker";
import dayjs from "dayjs";

const props = defineProps({
  modelValue: {
    type: [String, Date],
    default() {
      return dayjs().toDate();
    },
  },
});
const menu = ref(false);
const input = ref();
const emit = defineEmits(["update:modelValue"]);

watch(
  () => props.modelValue,
  (newValue) => {
    if (!newValue) return;
    input.value = newValue;
  },
  { immediate: true },
);

const dateFormatted = computed(() => {
  return dayjs(input.value || undefined).format("DD-MM-YYYY");
});

const getDate = computed(() => {
  return [dayjs(input.value || undefined).toDate()];
});

function updateDate(val) {
  menu.value = false;
  input.value = val;
  emit("update:modelValue", val);
}
</script>
