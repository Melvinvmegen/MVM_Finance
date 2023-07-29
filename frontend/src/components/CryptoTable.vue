<template lang="pug">
v-table.pt-3
  .grid
    CryptoCard.mt-3(v-for='crypto in items' @click="openModal(crypto)" :sold="crypto.sold")
      template(#header) 
        .d-flex.justify-space-between
          br
          v-row(align="center")
            span.mr-2 {{ crypto.name }}
            span.text-caption ({{ cryptoBuyingDate(crypto) }})
          v-row(v-if="!crypto.sold" justify="end" align="center")
            v-btn(variant="text" size="x-small" icon="mdi-delete" @click.stop="checkoutCrypto(crypto)")
            v-btn(variant="text" size="x-small" icon="mdi-swap-horizontal" @click.stop="swapping_crypto = crypto;openModal()")
      template(#upper_content)
        .d-flex
          p.mr-3 {{ Math.round(crypto.pricePurchase) }}
          v-badge(:color="returnCryptoPercentageGain(crypto) > 0 ? 'success' : 'error'" :content='$n(returnCryptoPercentageGain(crypto), "percent")')

      template(#upper_content_low)
        p.mr-3 {{ Math.round(crypto.price) }}

      template(#lower_content_button)
        v-chip.mt-3(color="secondary" gradient size="small") {{ $n(returnTotalPricePurchased(crypto) || 0, "currency") }}
      template(#lower_content_return)
        v-chip.mt-3(:color="returnTotalCurrentPrice(crypto) > returnTotalPricePurchased(crypto) ? 'success' : 'error'" size="small") {{ $n(returnTotalCurrentPrice(crypto) || 0, "currency") }}
        v-chip.mt-3(v-if='crypto.profit' :color="crypto.profit > returnTotalPricePurchased(crypto) ? 'success' : 'error'" size="small") {{ $n(Math.round(crypto.profit * 100) / 100, "currency") }} €

  v-row(justify="center").mb-3.mt-6
    v-btn(@click="openModal" color="secondary") {{ $t("cryptos.createToken") }}

  v-dialog(v-model='show_modal' width='800')
    v-card
      v-form(@submit.prevent="handleSubmit")
        v-card-title {{ mutable_crypto?.id ? $t("cryptos.editToken") : $t("cryptos.createToken") }}
        v-card-text
          v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
          v-row(dense)
            v-col(cols="12")
              v-text-field(name='name' :label='$t("cryptos.name")' v-model='mutable_crypto.name' :rules="[$v.required()]")
            v-col(cols="12")
              v-text-field(name='price' :label='$t("cryptos.price")' v-model.number='mutable_crypto.price' :rules="[$v.required(), $v.number()]")
            v-col(cols="12")
              v-text-field(name='profit' l:label='$t("cryptos.profit")' v-model.number='mutable_crypto.profit' :rules="[$v.number()]")
            v-col(cols="12")
          transition-group(name='slide-up')
            div(v-for='(transaction, index) in mutable_crypto.Transactions' :key="transaction.id || index")
              v-row(v-if="transaction?.markedForDestruction !== true")
                v-col(cols="2")
                  DateInput(:value="transaction.buyingDate")
                v-col(cols="2")
                  v-text-field(:label='$t("cryptos.exchange")' v-model="transaction.exchange" :rules="[$v.required()]")
                v-col(cols="2")
                  v-text-field(:label='$t("cryptos.price")' v-model.number="transaction.price"  @change="updateTotal(transaction)" :rules="[$v.required(), $v.number()]")
                v-col(cols="2")
                  v-text-field(:label='$t("cryptos.quantity")' v-model.number="transaction.quantity"  @change="updateTotal(transaction)" :rules="[$v.required(), $v.number()]")
                v-col(cols="2")
                  v-text-field(:label='$t("cryptos.fees")' v-model.number="transaction.fees" @change="updateTotal(transaction)"  :rules="[$v.required(), $v.number()]")

                v-col(cols="1")
                  v-btn(color="error" href='#' @click.prevent='removeItem(transaction)')
                    v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(color="primary" @click.prevent='addItem')
                  span {{ $t("cryptos.addLine") }}

        v-card-actions
          v-row(dense justify="center")
            v-col.d-flex.justify-center(cols="12" lg="8")
              v-btn.bg-secondary.text-white(type="submit") {{ mutable_crypto?.id ? $t("cryptos.editToken") : $t("cryptos.createToken") }}
</template>

<script setup lang="ts">
import type { CryptoCurrencies, Transactions } from "../../types/models";

type CryptoCurrencyWithTransactions = CryptoCurrencies & { Transactions: Transactions[] };
const indexStore = useIndexStore();
const cryptoStore = useCryptoStore();
const itemName = "Cryptos";
const show_modal = ref(false);
const mutable_crypto = ref({} as CryptoCurrencyWithTransactions);
const swapping_crypto = ref({} as CryptoCurrencyWithTransactions);
const { compute, filterAll } = useFilter(cryptoStore, "cryptos");
const { items } = compute;
const parentModelId = ref(0);
const cryptoDestroyId = ref(0);
provide("parentModelName", "Crypto");
provide("parentModelId", parentModelId);

filterAll(itemName);
const transactionItemTemplate = {
  createdAt: new Date(),
  updatedAt: new Date(),
  buyingDate: null,
  exchange: "",
  price: 0,
  quantity: 0,
  fees: 0,
  total: 0,
  CryptoCurrencyId: null,
  RevenuId: null,
};

function cryptoBuyingDate(crypto: CryptoCurrencyWithTransactions) {
  if (crypto?.Transactions?.length < 1) return;
  const date = new Date(crypto.Transactions.slice(-1)[0].buyingDate);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function returnCryptoPercentageGain(crypto: CryptoCurrencyWithTransactions) {
  const final_price = crypto.profit ? Math.round(crypto.profit * 100) / 100 : returnTotalCurrentPrice(crypto);
  const initial_price = returnTotalPricePurchased(crypto);

  return Math.round((((final_price || 0) - (initial_price || 0)) / (initial_price || 0)) * 100);
}

function returnTotalPricePurchased(crypto: CryptoCurrencyWithTransactions) {
  if (!crypto?.Transactions?.length) return;
  return (
    Math.round(
      crypto.Transactions.reduce(
        (sum: number, transaction) => sum + (transaction.price * transaction.quantity + transaction.fees),
        0,
      ) * 100,
    ) / 100
  );
}

function returnTotalCurrentPrice(crypto: CryptoCurrencyWithTransactions) {
  if (!crypto?.Transactions?.length) return;
  return (
    Math.round(
      crypto?.Transactions?.reduce((sum: number, transaction) => sum + crypto.price * transaction.quantity, 0) * 100,
    ) / 100
  );
}

function openModal(crypto = {} as CryptoCurrencies | any, id = 0) {
  cryptoDestroyId.value = id;
  show_modal.value = true;
  mutable_crypto.value = {};
  if ("id" in crypto && crypto) {
    mutable_crypto.value = crypto;
    parentModelId.value = crypto.id || 0;
  }
}

function updateTotal(item) {
  item.total = item.quantity * item.price + item.fees;
}

function addItem() {
  if (!mutable_crypto.value.Transactions) mutable_crypto.value.Transactions = [];
  mutable_crypto.value.Transactions.push({ ...transactionItemTemplate, CryptoCurrencyId: mutable_crypto.value.id });
}

function removeItem(item) {
  const index = mutable_crypto.value.Transactions.findIndex((transaction) => transaction.id === item.id);
  mutable_crypto.value.Transactions.splice(index, 1);
  mutable_crypto.value.total = mutable_crypto.value.Transactions?.reduce(
    (sum, transaction) => sum + transaction.total,
    0,
  );
}

async function handleSubmit(): Promise<void> {
  indexStore.setLoading(true);
  let action = mutable_crypto.value.id ? "updateCrypto" : "createCrypto";
  mutable_crypto.value.category = "Crypto";
  delete mutable_crypto.value.total;
  try {
    await cryptoStore[action](mutable_crypto.value);
    if (swapping_crypto.value.id) {
      swapping_crypto.value.sold = true;
      await cryptoStore.updateCrypto(swapping_crypto.value);
    }
    show_modal.value = false;
  } finally {
    indexStore.setLoading(false);
  }
}

async function checkoutCrypto(crypto): Promise<void> {
  indexStore.setLoading(true);
  crypto.sold = true;
  try {
    await cryptoStore.updateCrypto(crypto);
  } finally {
    indexStore.setLoading(false);
  }
}
</script>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(92px, 1fr));
  gap: 20px;
}

.v-table__wrapper {
  overflow: unset;
}
</style>
