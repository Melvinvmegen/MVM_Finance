<template>
  <v-text-field v-bind="$attrs" :modelValue="props.modelValue" @input="onInput" />
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: 0,
  },
  positive: {
    type: [Boolean],
    default: true,
  },
});

const emit = defineEmits(["update:modelValue"]);
function onInput(event) {
  const value = props.positive ? Math.abs(event.target.value) : Math.abs(event.target.value) * -1;
  emit("update:modelValue", parseFloat(value) || null);
}
</script>
