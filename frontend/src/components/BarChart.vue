<template lang="pug">
Bar(:data="chartData" :options="chartOptions")
</template>

<script setup lang="ts">
import { Bar } from "vue-chartjs";
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from "chart.js";

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

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
