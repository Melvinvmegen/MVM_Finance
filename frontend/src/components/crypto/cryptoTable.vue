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
          v-badge(:color="returnCryptoPercentageGain(crypto) > 0 ? 'success' : 'error'" :content='returnCryptoPercentageGain(crypto) + "%"')

      template(#upper_content_low)
        p.mr-3 {{ Math.round(crypto.price) }}

      template(#lower_content_button)
        v-chip.mt-3(color="secondary" gradient size="small") {{ returnTotalPricePurchased(crypto)}} €
      template(#lower_content_return)
        v-chip.mt-3(:color="returnTotalCurrentPrice(crypto) > returnTotalPricePurchased(crypto) ? 'success' : 'error'" size="small") {{ returnTotalCurrentPrice(crypto) }} €
        v-chip.mt-3(v-if='crypto.profit' :color="crypto.profit > returnTotalPricePurchased(crypto) ? 'success' : 'error'" size="small") {{ Math.round(crypto.profit * 100) / 100 }} €

  v-row(justify="center").mb-3.mt-6
    v-btn(@click="openModal" color="secondary") Créer un token

  v-dialog(v-model='show_modal' width='800')
    v-card
      v-form(@submit.prevent="handleSubmit")
        v-card-title {{ mutable_crypto?.id ? "Editer un token" : "Créer un token" }}
        v-card-text
          v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
          v-row(dense)
            v-col(cols="12")
              v-text-field.form-control(name='name' label='Name' density="compact" type='text' v-model='mutable_crypto.name')
            v-col(cols="12")
              v-text-field.form-control(name='price' label='Price' density="compact" type='number' v-model.number='mutable_crypto.price')
            v-col(cols="12")
              v-text-field.form-control(name='profit' label="Bénéfice" density="compact" type='number' v-model.number='mutable_crypto.profit')
            v-col(cols="12")
          transition-group(name='slide-up')
            div(v-for='(transaction, index) in mutable_crypto.Transactions' :key="transaction.id || index")
              v-row(v-if="transaction?.markedForDestruction !== true")
                v-col(cols="2")
                  Datepicker(
                    name="buyingDate",
                    v-model="transaction.buyingDate",
                    format="dd/MM/yyyy"
                    dark
                    position="center"
                    :month-change-on-scroll="false"
                    auto-apply
                  )
                v-col(cols="2")
                  v-text-field(label='Exchange' density="compact" v-model="transaction.exchange" variant="outlined")
                v-col(cols="2")
                  v-text-field(label='Prix' density="compact" v-model.number="transaction.price" type='number' @change="updateTotal(transaction)" variant="outlined")
                v-col(cols="2")
                  v-text-field(label='Quantity' density="compact" v-model.number="transaction.quantity" type='number' @change="updateTotal(transaction)" variant="outlined")
                v-col(cols="2")
                  v-text-field(label='Frais' density="compact" v-model.number="transaction.fees" @change="updateTotal(transaction)" type='number' variant="outlined")

                v-col(cols="1")
                  v-btn(color="error" href='#' @click.prevent='removeItem(transaction)')
                    v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(color="primary" @click.prevent='addItem')
                  span + Ajouter une ligne

        v-card-actions
          v-row(dense justify="center")
            v-col.d-flex.justify-center(cols="12" lg="8")
              v-btn.bg-secondary.text-white(type="submit") {{ mutable_crypto?.id ? "Mettre à jour une crypto" : "Créer une cypto" }}
</template>

<script setup lang="ts">
import { ref, provide } from "vue";
import useFilter from "../../hooks/filter";
import type Crypto from "../../types/Crypto";
import type Transaction from "../../types/Transaction";
import CryptoCard from "./cryptoCard.vue";
import Datepicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useIndexStore } from "../../store/indexStore";
import { useCryptoStore } from "../../store/cryptoStore";

const indexStore = useIndexStore();
const cryptoStore = useCryptoStore();
const itemName = "Cryptos";
const show_modal = ref(false);
const mutable_crypto = ref({} as Crypto);
const swapping_crypto = ref({} as Crypto);
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

function cryptoBuyingDate(crypto: Crypto) {
  if (crypto?.Transactions?.length < 1) return;
  const date = new Date(crypto.Transactions.slice(-1)[0].buyingDate);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

function returnCryptoPercentageGain(crypto: Crypto) {
  const final_price = crypto.profit ? Math.round(crypto.profit * 100) / 100 : returnTotalCurrentPrice(crypto);
  const initial_price = returnTotalPricePurchased(crypto);

  return Math.round(((final_price - initial_price) / initial_price) * 100);
}

function returnTotalPricePurchased(crypto: Crypto) {
  if (!crypto?.Transactions?.length) return;
  return (
    Math.round(
      crypto.Transactions.reduce(
        (sum: number, transaction: Transaction) => sum + (transaction.price * transaction.quantity + transaction.fees),
        0
      ) * 100
    ) / 100
  );
}

function returnTotalCurrentPrice(crypto: Crypto) {
  if (!crypto?.Transactions?.length) return;
  return (
    Math.round(
      crypto?.Transactions?.reduce(
        (sum: number, transaction: Transaction) => sum + crypto.price * transaction.quantity,
        0
      ) * 100
    ) / 100
  );
}

function openModal(crypto = {} as Crypto | any, id = 0) {
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
    0
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
  overflow: unset
}
</style>
