<template lang="pug">
v-table.pt-3
  .grid
    CryptoCard.mt-3(v-for='crypto in props.cryptos' :key="crypto.id" @click="openModal(crypto)" :sold="crypto.sold")
      template(#header) 
        .d-flex.justify-space-between.align-center
          br
          v-row(align="center")
            span.mr-2 {{ crypto.name }}
            span.text-caption ({{ cryptoBuyingDate(crypto) }})
          v-row.mt-0(v-if="!crypto.sold" justify="end" align="center")
            v-btn(variant="text" size="small" icon="mdi-delete" @click.stop="checkoutCrypto(crypto)")
            v-btn(variant="text" size="small" icon="mdi-swap-horizontal" @click.stop="swappingCrypto = crypto; openModal()")
      template(#upper_content)
        .d-flex
          p.mr-3 {{ returnCryptoPrice(crypto.price_purchase) }}
          v-badge.ml-1(:color="returnCryptoPercentageDifference(crypto) > 0 ? 'success' : 'error'" :content='$n(returnCryptoPercentageDifference(crypto), "percent")')

      template(#upper_content_low)
        p.mr-3 {{ returnCryptoPrice(crypto.price) }}

      template(#lower_content_button)
        v-chip.mt-3(color="secondary" gradient size="small") {{ $n(returnTotalPricePurchased(crypto) || 0, "currency") }}
      template(#lower_content_return)
        v-chip.mt-3(:color="returnTotalCurrentPrice(crypto) > returnTotalPricePurchased(crypto) ? 'success' : 'error'" size="small") {{ $n(returnTotalCurrentPrice(crypto) || 0, "currency") }}
        v-chip.mt-3(v-if='crypto.profit' :color="crypto.profit > returnTotalPricePurchased(crypto) ? 'success' : 'error'" size="small") {{ $n(Math.round(crypto.profit * 100) / 100, "currency") }}

  v-row(justify="center").mb-3.mt-6
    v-btn(@click="openModal" color="secondary") {{ $t("cryptos.createToken") }}

  v-dialog(v-model='showModal' width='800')
    v-card.pa-4.w-100
      v-form(v-model="valid" @submit.prevent="handleSubmit")
        v-card-title.mb-4 {{ dialogTitle }}
        v-card-text
          v-row(dense)
            v-col(cols="12" sm="4")
              v-text-field(name='name' :label='$t("cryptos.name")' v-model='mutable_crypto.name' :rules="[$v.required()]")
            v-col(cols="12" sm="4")
              NumberInput(name='price' :label='$t("cryptos.price")' v-model='mutable_crypto.price' :rules="[$v.number()]")
            v-col(cols="12" sm="4")
              NumberInput(name='profit' :label='$t("cryptos.profit")' v-model='mutable_crypto.profit' :rules="[$v.number()]")
            v-col(cols="12" sm="4")
          v-divider.mb-6
          transition-group(name='slide-up' v-if="mutable_crypto?.transactions?.length")
            div(v-for='(transaction, index) in mutable_crypto.transactions' :key="index")
              v-row(v-if="transaction?.markedForDestruction !== true")
                v-col(cols="12" sm="3")
                  DateInput(v-model="transaction.buying_date")
                v-col(cols="12" sm="2")
                  v-text-field(:label='$t("cryptos.exchange")' v-model="transaction.exchange" :rules="[$v.required()]")
                v-col(cols="12" sm="2")
                  NumberInput(:label='$t("cryptos.price")' v-model="transaction.price"  @change="updateTotal(transaction)" :rules="[$v.number()]")
                v-col(cols="12" sm="2")
                  NumberInput(:label='$t("cryptos.quantity")' v-model="transaction.quantity"  @change="updateTotal(transaction)" :rules="[$v.number()]")
                v-col(cols="12" sm="2")
                  NumberInput(:label='$t("cryptos.fees")' v-model="transaction.fees" @change="updateTotal(transaction)"  :rules="[$v.required(), $v.number()]")

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
import dayjs from "dayjs";
import type { crypto_currency, transaction } from "../../types/models";
import { createCrypto, updateCrypto } from "../utils/generated/api-user";

type CryptoCurrencyWithTransactions = crypto_currency & { transactions: transaction[] };
const loadingStore = useLoadingStore();
const showModal = ref(false);
const valid = ref(false);
const mutable_crypto = ref({} as CryptoCurrencyWithTransactions);
const swappingCrypto = ref({} as CryptoCurrencyWithTransactions);
const parentModelId = ref(0);
const cryptoDestroyId = ref(0);
const props = defineProps({
  cryptos: Array<CryptoCurrencyWithTransactions>,
});
provide("parentModelName", "Crypto");
provide("parentModelId", parentModelId);

const transactionItemTemplate = {
  buying_date: null,
  exchange: "",
  price: 0,
  quantity: 0,
  fees: 0,
  total: 0,
  crypto_currency_id: null,
  revenu_id: null,
};

const { t: $t } = useI18n();
const dialogTitle = computed(() => {
  if (swappingCrypto.value?.id) {
    return $t("cryptos.swapToken", [swappingCrypto.value.name]);
  } else if (mutable_crypto.value?.id) {
    return $t("cryptos.editToken");
  } else {
    return $t("cryptos.createToken");
  }
});

function cryptoBuyingDate(crypto: CryptoCurrencyWithTransactions) {
  if (crypto?.transactions?.length < 1) return;
  const buying_date = dayjs(crypto.transactions.slice(-1)[0].buying_date || undefined);
  return buying_date.format("LL");
}

function returnCryptoPercentageDifference(crypto: CryptoCurrencyWithTransactions) {
  const final_price = crypto.profit ? Math.round(crypto.profit * 100) / 100 : returnTotalCurrentPrice(crypto) || 0;
  const initial_price = returnTotalPricePurchased(crypto) || 0;
  return (final_price - initial_price) / initial_price;
}

function returnTotalPricePurchased(crypto: CryptoCurrencyWithTransactions) {
  if (!crypto?.transactions?.length) return 0;
  return (
    Math.round(
      crypto.transactions.reduce(
        (sum: number, transaction) => sum + (transaction.price * transaction.quantity + transaction.fees),
        0,
      ) * 100,
    ) / 100
  );
}

function returnTotalCurrentPrice(crypto: CryptoCurrencyWithTransactions) {
  if (!crypto?.transactions?.length) return 0;
  return (
    Math.round(
      crypto?.transactions?.reduce((sum: number, transaction) => sum + crypto.price * transaction.quantity, 0) * 100,
    ) / 100
  );
}

function returnCryptoPrice(price: number) {
  return price.toFixed(2) === "0.00" ? price.toFixed(6) : price.toFixed(2);
}

function openModal(crypto = {} as crypto_currency | any, id = 0) {
  cryptoDestroyId.value = id;
  showModal.value = true;
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
  if (!mutable_crypto.value.transactions) mutable_crypto.value.transactions = [];
  mutable_crypto.value.transactions.push({ ...transactionItemTemplate, crypto_currency_id: mutable_crypto.value.id });
}

function removeItem(item) {
  const index = mutable_crypto.value.transactions.findIndex((transaction) => transaction.id === item.id);
  mutable_crypto.value.transactions.splice(index, 1);
  mutable_crypto.value.total = mutable_crypto.value.transactions?.reduce(
    (sum, transaction) => sum + transaction.total,
    0,
  );
}

const emit = defineEmits(["refreshCryptos"]);
async function handleSubmit(): Promise<void> {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  mutable_crypto.value.category = "Crypto";
  try {
    if (mutable_crypto.value.id) {
      await updateCrypto(mutable_crypto.value.id, mutable_crypto.value);
    } else {
      await createCrypto(mutable_crypto.value);
      if (swappingCrypto.value.id) {
        swappingCrypto.value.sold = true;
        await updateCrypto(swappingCrypto.value.id, swappingCrypto.value);
      }
      emit("refreshCryptos");
    }
    showModal.value = false;
  } finally {
    loadingStore.setLoading(false);
  }
}

async function checkoutCrypto(crypto: crypto_currency): Promise<void> {
  loadingStore.setLoading(true);
  crypto.sold = true;
  try {
    await updateCrypto(crypto.id, crypto);
  } finally {
    loadingStore.setLoading(false);
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
