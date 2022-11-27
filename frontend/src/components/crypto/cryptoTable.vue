<template lang="pug">
v-card(elevation="3")
  v-card-text.py-0(v-if="!indexStore.loading")
    v-container
      v-row
        CryptoCard
          template(#header)
            v-row
              v-col(cols="3").d-flex.justify-center.align-center
                span.mr-5 Watchlist
                v-badge(:color="returnGlobalCryptoPercentageGain() > 0 ? 'success' : 'error'" :content='returnGlobalCryptoPercentageGain() + "%"')
              v-spacer
              v-col(cols="1")
                v-btn(variant="text" icon="mdi-refresh" @click="fetchPriceUpdate")
          template(#lower_content_button)
            v-chip.mt-3(color="secondary" size="small") {{ returnTotalInvestment()}} €
          template(#lower_content_return)
            v-chip.mt-3(:color="returnInvestmentCurrentValue() > returnTotalInvestment() ? 'success' : 'error'" size="small") {{ returnInvestmentCurrentValue() }} €
            v-chip.mt-3(:color="returnTotalInvestmentProfit() > returnTotalInvestment() ? 'success' : 'error'" size="small") {{ returnTotalInvestmentProfit() }} €

    //- v-row.pt-3(justify="center")
    //-   v-col(cols="12" md="6")
    //-     CryptoCard
    //-       template(#header)
    //-         .d-flex
    //-           span.mr-3 Bots
    //-           v-badge(:color="returnCryptoPercentageGain([...filteredItems(categories[0])]) > 0 ? 'success' : 'error'" :content='returnCryptoPercentageGain([...filteredItems(categories[0])]) + "%"')
    //-       template(#lower_content_button)
    //-         v-chip.mt-3(color="warning" gradient size="small") {{ returnTotalInvestment(categories[0])}} €
    //-       template(#lower_content_return)
    //-         v-chip.mt-3(:color="returnInvestmentCurrentValue(categories[0]) > returnTotalInvestment(categories[0]) ? 'success' : 'error'" size="small") {{ returnInvestmentCurrentValue(categories[0]) }} €
    //-         v-chip.mt-3(:color="returnInvestmentProfit(categories[0]) > returnTotalInvestment(categories[0]) ? 'success' : 'error'" size="small") {{ returnInvestmentProfit(categories[0]) }} €

    //-   v-col(cols="12" md="6")
    //-     CryptoCard
    //-       template(#header)
    //-         .d-flex
    //-           span.mr-3 Cryptos
    //-           v-badge(:color="returnCryptoPercentageGain([...filteredItems(categories[1])]) > 0 ? 'success' : 'error'" :content='returnCryptoPercentageGain([...filteredItems(categories[1])]) + "%"')
    //-       template(#lower_content_button)
    //-         v-chip.mt-3(color="primary" gradient size="small") {{ returnTotalInvestment(categories[1])}} €
    //-       template(#lower_content_return)
    //-         v-chip.mt-3(:color="returnInvestmentCurrentValue(categories[1]) > returnTotalInvestment(categories[1]) ? 'success' : 'error'" size="small") {{ returnInvestmentCurrentValue(categories[1]) }} €
    //-         v-chip.mt-3(:color="returnInvestmentProfit(categories[1]) > returnTotalInvestment(categories[1]) ? 'success' : 'error'" size="small") {{ returnInvestmentProfit(categories[1]) }} €

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

      v-row(justify="center").mt-3
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
                  //- v-text-field.form-control(name='category' type="Category" as="select" v-model='crypto.category')
                  //-   option(disabled value="") Please select one
                  //-   option(v-for='category in categories' :key="category" v-model="category") {{ category }}
              transition-group(name='slide-up')
                div(v-for='(transaction, index) in mutable_crypto.Transactions' :key="transaction.id || index")
                  v-row(v-if="transaction?.markedForDestruction !== true")
                    v-col(cols="2")
                      input(name='buyingDate' v-model="transaction.buyingDate" type='hidden')
                      DatePicker(
                        name="buyingDate",
                        class="form-control",
                        v-model="transaction.buyingDate",
                        inputFormat="dd/MM/yyyy"
                      )
                      v-icon mdi-calendar
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
import { ref, provide, onUnmounted } from "vue";
import useFilter from "../../hooks/filter";
import type Crypto from "../../types/Crypto";
import type Transaction from "../../types/Transaction";
import CryptoCard from "./cryptoCard.vue";
import DatePicker from "vue3-datepicker";
import { useIndexStore } from "../../store/indexStore.ts";
import { useCryptoStore } from "../../store/cryptoStore.ts";

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
const categories = ["Bots", "Crypto"];
provide("parentModelName", "Crypto");
provide("parentModelId", parentModelId);

// fetchPriceUpdate();
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
  CryptoId: null,
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

function returnGlobalCryptoPercentageGain() {
  const total_investment = returnTotalInvestment();
  const total_investment_profit = returnTotalInvestmentProfit();

  return  Math.round((total_investment_profit - total_investment) / total_investment * 100);
}

function returnTotalPricePurchased(crypto: Crypto) {
  if (crypto?.Transactions?.length < 1) return;
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
  if (crypto?.Transactions?.length < 1) return;
  return (
    Math.round(
      crypto.Transactions.reduce(
        (sum: number, transaction: Transaction) => sum + crypto.price * transaction.quantity,
        0
      ) * 100
    ) / 100
  );
}

function returnTotalInvestment(category = "") {
  const cryptos = category ? filteredItems(category) : items.value;
  const arr = cryptos.filter((c) => !c.sold).map((crypto) => returnTotalPricePurchased(crypto));

  return (
    Math.round(arr.filter((t) => t).reduce((sum: number, cryptoTotal: number) => sum + +cryptoTotal, 0) * 100) / 100
  );
}

function returnInvestmentCurrentValue(category = "") {
  const cryptos = category ? filteredItems(category) : items.value;
  const arr = cryptos
    .filter((c) => !c.sold)
    .map((crypto) => {
      if (crypto.Transactions.length > 0) {
        const quantityPurchased = crypto.Transactions.reduce(
          (sum: number, transaction: Transaction) => sum + transaction.quantity,
          0
        );
        return +crypto.price * +quantityPurchased;
      }
    });

  return (
    Math.round(arr.filter((t) => t).reduce((sum: number, cryptoTotal: number) => sum + +cryptoTotal, 0) * 100) / 100
  );
}

function returnInvestmentProfit(category = "") {
  const cryptos = category ? filteredItems(category) : items.value;
  return (
    Math.round(cryptos.filter((t) => !t.sold).reduce((sum: number, crypto: Crypto) => sum + crypto.profit, 0) * 100) /
    100
  );
}

function returnTotalInvestmentProfit() {
  const arr = items.value
    .filter((c) => !c.sold)
    .map((crypto) => {
      if (crypto.profit) return crypto.profit;
      else if (crypto.Transactions.length > 0) {
        const quantityPurchased = crypto.Transactions.reduce(
          (sum: number, transaction: Transaction) => sum + transaction.quantity,
          0
        );
        return crypto.price * quantityPurchased;
      }
    });
  return (
    Math.round(arr.filter((t) => t).reduce((sum: number, cryptoTotal: number) => sum + cryptoTotal, 0) * 100) / 100
  );
}

function filteredItems(category: string) {
  return items.value.filter((crypto) => crypto.category === category);
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

async function fetchPriceUpdate(): Promise<void> {
  indexStore.setLoading(true);
  try {
    await cryptoStore.updateCryptos();
  } finally {
    indexStore.setLoading(false);
  }
}

function updateTotal(item) {
  item.total = item.quantity * item.price + item.fees;
}

function addItem() {
  if (!mutable_crypto.value.Transactions) mutable_crypto.value.Transactions = [];
  mutable_crypto.value.Transactions.push({ ...transactionItemTemplate, CryptoId: mutable_crypto.value.id });
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
  if (!mutable_crypto.value.createdAt) mutable_crypto.value.createdAt = new Date();
  mutable_crypto.value.updatedAt = new Date();
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

onUnmounted(() => {
  items.value = null;
})
</script>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(92px, 1fr));
  gap: 10px;
}
</style>
