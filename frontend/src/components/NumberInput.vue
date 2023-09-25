<template>
  <v-text-field v-bind="$attrs" :modelValue="props.modelValue" @input="onInput" />
</template>

<script setup lang="ts">
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: 0,
  },
});

const emit = defineEmits(["update:modelValue"]);
function onInput(event) {
  emit("update:modelValue", parseFloat(event.target.value) || null);
}

function onKeydown(event) {
  if (/^[^0-9,. -]$/.test(event.key)) {
    event.preventDefault();
  }
}
</script>
