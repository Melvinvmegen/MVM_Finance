<template lang="pug">
v-card(width="100%" :disabled="sold")
  v-card-title.justify-center
    slot(name="header") Crypto
  v-card-text.justify-center

      v-row(justify="space-between" align="center")
        v-col.mb-4(cols="5" justify="start")
          slot(name="lower_content_button")
        v-col(cols="2")
          v-row.flex-column.align-center
            slot(name="upper_content")
            v-icon mdi-arrow-right
            slot(name="upper_content_low")
        v-col(cols="5" justify="end")
          v-row(align="end").flex-column
            slot(name="lower_content_return")

</template>

<script setup lang="ts">
const props = defineProps({
  sold: Boolean,
})
</script>
