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
        <v-text-field
          :label="componentProps.label"
          v-bind="props"
          :modelValue="dateFormatted"
          append-inner-icon="mdi-calendar"
        ></v-text-field>
      </template>
      <v-date-picker
        :modelValue="getDate"
        @update:modelValue="updateDate"
        show-adjacent-months
        location="bottom"
      ></v-date-picker>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";

const componentProps = defineProps({
  modelValue: {
    type: [String, Date],
    default() {
      return dayjs().toDate();
    },
  },
  label: String,
});
const menu = ref(false);
const input = ref();
const emit = defineEmits(["update:modelValue"]);

watch(
  () => componentProps.modelValue,
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
