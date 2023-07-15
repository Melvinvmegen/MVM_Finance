<template lang="pug">
v-row
  v-col(cols="12" md="8")
    v-card(elevation="3")
      v-card-title
        v-row(justify="space-between" align="center")
          v-col.text-uppercase(cols="11") Cryptos

      v-card-text
        crypto-table
    .mt-4
  v-col(cols="12" md="4")
    v-card(elevation="3")
      v-card-text.py-0
        v-container
          v-row
            CryptoCard
              template(#header)
                v-row
                  v-col(cols="3").d-flex.justify-center.align-center
                    span.mr-5 Watchlist
                    v-badge(:color="returnGlobalCryptoPercentageGain > 0 ? 'success' : 'error'" :content='returnGlobalCryptoPercentageGain + "%"')
                  v-spacer
                  v-col(cols="1")
                    v-btn(variant="text" icon="mdi-refresh" @click="fetchPriceUpdate")
              template(#lower_content_button)
                v-chip.mt-3(color="secondary" size="small") {{ returnTotalInvestment }} €
              template(#lower_content_return)
                v-chip.mt-3(:color="returnInvestmentCurrentValue > returnTotalInvestment ? 'success' : 'error'" size="small") {{ returnInvestmentCurrentValue }} €
                v-chip.mt-3(:color="returnTotalInvestmentProfit > returnTotalInvestment ? 'success' : 'error'" size="small") {{ returnTotalInvestmentProfit }} €
          hr.mx-2.my-4
          v-card-text
            v-card-title Répartition des cryptos
            pie(v-if="chartData" :chart-data='chartData' :chart-options='chartOptions')

</template>

<script setup lang="ts">
import type Transaction from "../../types/Transaction";
import type Crypto from "../../types/Crypto";

const indexStore = useIndexStore();
const cryptoStore = useCryptoStore();
const { compute } = useFilter(cryptoStore, "cryptos");
const { items } = compute;

const chartData = computed(() => {
  const chartData = {
    labels: cryptoStore.cryptos.filter((c) => !c.sold).map((crypto) => crypto.name),
    datasets: [
      {
        label: "",
        data: [],
        backgroundColor: ["#05445E", "#189AB4", "#75E6DA", "#D4F1F4", "#FD7F20", "#FC2E20", "#FDB750"],
      },
    ],
  };
  for (let crypto of cryptoStore.cryptos.filter((c) => !c.sold)) {
    if (crypto.Transactions) {
      const totals = crypto.Transactions.reduce((sum, transaction) => sum + transaction.total, 0);
      const value = (totals / +returnTotalInvestment.value) * 100;
      chartData.datasets[0].data.push(+value.toFixed(2));
    } else {
      chartData.datasets[0].data.push(0);
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

fetchPriceUpdate();

const returnTotalInvestmentProfit = computed(() => {
  const arr = items.value
    .filter((c) => !c.sold)
    .map((crypto) => {
      if (crypto.profit) return crypto.profit;
      else if (crypto.Transactions.length > 0) {
        const quantityPurchased = crypto.Transactions.reduce(
          (sum: number, transaction: Transaction) => sum + transaction.quantity,
          0,
        );
        return crypto.price * quantityPurchased;
      }
    });
  return (
    Math.round(arr.filter((t) => t).reduce((sum: number, cryptoTotal: number) => sum + cryptoTotal, 0) * 100) / 100
  );
});

const returnTotalInvestment = computed(() => {
  const cryptos = items.value;
  const arr = cryptos.filter((c) => !c.sold).map((crypto) => returnTotalPricePurchased(crypto));

  return (
    Math.round(arr.filter((t) => t).reduce((sum: number, cryptoTotal: number) => sum + +cryptoTotal, 0) * 100) / 100
  );
});

const returnGlobalCryptoPercentageGain = computed(() => {
  const total_investment = returnTotalInvestment.value;
  const total_investment_profit = returnTotalInvestmentProfit.value;

  return Math.round(((total_investment_profit - total_investment) / total_investment) * 100);
});

const returnInvestmentCurrentValue = computed(() => {
  const cryptos = items.value;
  const arr = cryptos
    .filter((c) => !c.sold)
    .map((crypto) => {
      if (crypto.Transactions.length > 0) {
        const quantityPurchased = crypto.Transactions.reduce(
          (sum: number, transaction: Transaction) => sum + transaction.quantity,
          0,
        );
        return +crypto.price * +quantityPurchased;
      }
    });

  return (
    Math.round(arr.filter((t) => t).reduce((sum: number, cryptoTotal: number) => sum + +cryptoTotal, 0) * 100) / 100
  );
});

function returnTotalPricePurchased(crypto: Crypto) {
  if (crypto?.Transactions?.length < 1) return;
  return (
    Math.round(
      crypto.Transactions.reduce(
        (sum: number, transaction: Transaction) => sum + (transaction.price * transaction.quantity + transaction.fees),
        0,
      ) * 100,
    ) / 100
  );
}

async function fetchPriceUpdate(): Promise<void> {
  indexStore.setLoading(true);
  try {
    await cryptoStore.updateCryptos();
  } finally {
    indexStore.setLoading(false);
  }
}
</script>
