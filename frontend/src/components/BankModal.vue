<script setup lang="ts">
import dayjs from "dayjs";
import { createBank, updateBank } from "../utils/generated/api-user";

const loadingStore = useLoadingStore();
const props = defineProps({
  show: Boolean,
  model: {
    type: Object,
    required: true,
  },
  accountTypes: {
    type: Array,
    required: true,
  },
});

const mutableBank = ref(props.model);
const valid = ref(false);

async function handleBankSubmit(): Promise<void> {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  try {
    if (mutableBank.value.id) {
      await updateBank(mutableBank.value.id, {
        name: mutableBank.value.name,
        amount: mutableBank.value.amount,
        amountDate: dayjs(mutableBank.value.amountDate),
        AccountTypeId: mutableBank.value.AccountTypeId,
      });
    } else {
      await createBank(mutableBank.value);
    }
    window.location.reload();
  } finally {
    loadingStore.setLoading(false);
  }
}

function itemProps(item) {
  return {
    title: item.name,
    value: item.id,
  };
}
</script>

<template lang="pug">
v-dialog(:model-value='props.show' width='600' persistent)
  v-card(width="100%")
    v-form(v-model="valid" @submit.prevent="handleBankSubmit")
      v-card-title.text-center {{ mutableBank?.id ? $t("dashboard.editBank") : $t("dashboard.addBank") }}
      v-card-text.mt-4
        v-row(dense justify="center")
          v-col(cols="10")
            v-select(:items="accountTypes" :item-props="itemProps" v-model="mutableBank.AccountTypeId" :label='$t("dashboard.accountType")')
          v-col(cols="10")
            v-text-field(name='name' :label='$t("dashboard.name")' v-model='mutableBank.name' :rules="[$v.required()]")
          v-col(cols="10")
            NumberInput(name='amount' :label='$t("dashboard.amount")' v-model='mutableBank.amount' :rules="[$v.required(),$v.number()]")
          v-col(cols="10")
            DateInput(v-model='mutableBank.amountDate' :label='$t("dashboard.amountDate")' :rules="[$v.required()]")

      v-card-actions.mb-2
        v-row(dense justify="center")
          v-col.d-flex.justify-center(cols="12" lg="8")
            v-btn.bg-primary.text-white(@click="$emit('close')") {{ $t("dashboard.cancel") }}
            v-btn.bg-secondary.text-white(type="submit") {{ mutableBank?.id ? $t("dashboard.editBank") : $t("dashboard.addBank") }}

</template>
