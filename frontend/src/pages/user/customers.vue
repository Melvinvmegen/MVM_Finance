<template lang="pug">
v-row
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") Clients
          v-spacer  
          v-col(cols="1" class="d-flex justify-center align-center")
            router-link(:to="'/customers/new'")
              v-btn(icon="mdi-plus" color="primary")

      v-card-text
        CustomerTable
    .mt-4
  v-col(cols="12" md="4")
    v-card(position="absolute" class="v-col v-col-3")
      v-card-text
        v-row(justify="space-around" align="center")
          v-card-subtitle Chiffres d'affaires
          v-card-title {{ returnTotals(true, "totalTTC") }} €
        v-row(justify="space-around" align="center")
          v-card-subtitle Impayés
          v-card-title {{ returnTotals((false || null), "totalTTC") }} €
        v-row(justify="space-around" align="center")
          v-card-subtitle TVA collectée
          v-card-title {{ returnTotals(true, "tvaAmount") }} €
      hr.mx-2.my-4
      v-card-text
        v-card-title Répartition du chiffre d'affaires par client 
        PieChart(v-if="chartData" :chart-data='chartData' :chart-options='chartOptions')

</template>

<script setup lang="ts">
const customerStore = useCustomerStore();

const chartData = computed(() => {
  const chartData = {
    labels: customerStore.customers.map((customer) => customer.company),
    datasets: [
      {
        label: "",
        data: [] as string[],
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20", "#FC2E20", "#FDB750"],
      },
    ],
  };
  const total = returnTotals(true, "totalTTC");
  for (let customer of customerStore.customers) {
    if (customer.Invoices) {
      const invoices_percentage_of_total = (
        (customer.Invoices.reduce((sum, invoice) => sum + invoice.totalTTC, 0) / total) *
        100
      ).toFixed(2);
      chartData.datasets[0].data.push(invoices_percentage_of_total);
    } else {
      chartData.datasets[0].data.push("0");
    }
  }
  return chartData;
});

const chartOptions = {
  responsive: true,
  plugins: {
    tooltip: {
      callbacks: {
        label: function (context) {
          let tooltipData = context.dataset.data[context.dataIndex];
          return ` ${tooltipData}%`;
        },
      },
    },
  },
};

function returnTotals(paid: boolean, field: string) {
  let total = 0;
  for (let customer of customerStore.customers) {
    total += customer.Invoices.filter((invoice) => invoice.paid === paid).reduce(
      (sum, invoice) => sum + invoice[field],
      0,
    );
  }
  return +total.toFixed(2);
}
</script>
