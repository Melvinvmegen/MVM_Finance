<template lang="pug">
v-row
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") {{ $t("customers.title") }}
          v-spacer  
          v-col(cols="1" class="d-flex justify-center align-center")
            router-link(:to="'/customers/new'")
              v-btn(icon="mdi-plus" color="primary")

      v-card-text
        CustomerTable(:items="items" @filter="refreshCustomers")
    .mt-4
  v-col(cols="12" md="4")
    v-card
      v-card-text
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("customers.turnover") }}
          v-card-title {{ $n(returnTotals(true, "total_ttc"), "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("customers.unpaid") }}
          v-card-title {{ $n(returnTotals(false, "total_ttc"), "currency") }}
        v-row(justify="space-around" align="center")
          v-card-subtitle {{ $t("customers.vatCollected") }}
          v-card-title {{ $n(returnTotals(true, "tva_amount"), "currency") }} €
    v-card.mt-4
      v-card-text
        v-card-title.text-center.mb-2 {{ $t("customers.turnoverByCustomer") }} 
        PieChart(v-if="chartData" :chart-data='chartData' :chart-options='chartOptions')

</template>

<script setup lang="ts">
import { getCustomers } from "../../utils/generated/api-user";
const loadingStore = useLoadingStore();

const { filterAll, items } = useFilter(getCustomers);

async function refreshCustomers(value) {
  loadingStore.setLoading(true);
  try {
    await filterAll({
      ...value,
      force: !!items.value.count,
    });
  } catch (err) {
    console.error(err);
  } finally {
    loadingStore.setLoading(false);
  }
}

const chartData = computed(() => {
  const chartData = {
    labels: items.value.rows.map((customer) => customer.company),
    datasets: [
      {
        label: "",
        data: [] as string[],
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20", "#FC2E20", "#FDB750"],
      },
    ],
  };
  const total = returnTotals(true, "total_ttc");
  for (let customer of items.value.rows) {
    if (customer.invoices) {
      const invoices_percentage_of_total = (
        (customer.invoices.reduce((sum, invoice) => sum + invoice.total_ttc, 0) / total) *
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
  for (let customer of items.value.rows) {
    total += customer.invoices.filter((invoice) => invoice.paid === paid).reduce(
      (sum, invoice) => sum + invoice[field],
      0,
    );
  }
  return +total.toFixed(2);
}
</script>
