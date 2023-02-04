<template lang="pug">
Line(:data="chartData" :options="chartOptions")
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

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
