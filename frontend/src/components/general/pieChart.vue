<template lang="pug">
pie(:data="chartData" :options="chartOptions")
</template>

<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

defineProps({
  chartData: {
    type: Object,
    require: true,
  },
  chartOptions: {
    type: Object,
    require: true,
  },
});
</script>
