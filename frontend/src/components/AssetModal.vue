<script setup lang="ts">
import dayjs from "dayjs";
import { createAsset, updateAsset } from "../utils/generated/api-user";

const loadingStore = useLoadingStore();
const props = defineProps({
  show: Boolean,
  model: {
    type: Object,
    required: true,
  },
  assetTypes: {
    type: Array,
    required: true,
  },
});

const mutableAsset = ref({ creation_date: dayjs().toDate(), ...props.model });
const valid = ref(false);

async function submit(): Promise<void> {
  if (!valid.value) return;
  loadingStore.setLoading(true);
  try {
    if (mutableAsset.value.id) {
      await updateAsset(mutableAsset.value.id, {
        name: mutableAsset.value.name,
        amount: mutableAsset.value.amount,
        amount_date: dayjs(mutableAsset.value.amount_date),
        asset_type_id: mutableAsset.value.asset_type_id,
      });
    } else {
      await createAsset(mutableAsset.value);
    }
    window.location.reload();
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>

<template lang="pug">
v-dialog(:model-value='props.show' width='600' persistent)
  v-card(width="100%")
    v-form(v-model="valid" @submit.prevent="submit")
      v-card-title.text-center {{ mutableAsset?.id ? $t("dashboard.editAsset") : $t("dashboard.addAsset") }}
      v-card-text.mt-4
        v-row(dense justify="center")
          v-col(cols="10")
            DateInput(v-model='mutableAsset.creation_date' :label='$t("dashboard.creation_date")' :rules="[$v.required()]")
          v-col(cols="10")
            v-select(:items="assetTypes" :item-props="itemProps" v-model="mutableAsset.asset_type_id" :label='$t("dashboard.asset_type")')
          v-col(cols="10")
            v-text-field(name='name' :label='$t("dashboard.name")' v-model='mutableAsset.name' :rules="[$v.required()]")
          v-col(cols="10")
            NumberInput(name='amount' :label='$t("dashboard.amount")' v-model='mutableAsset.amount' :rules="[$v.required(),$v.number()]")
          v-col(cols="10")
            DateInput(v-model='mutableAsset.amount_date' :label='$t("dashboard.amount_date")' :rules="[$v.required()]")

      v-card-actions.mb-2
        v-row(dense justify="center")
          v-col.d-flex.justify-center(cols="12" lg="8")
            v-btn.bg-grey.text-white(@click="$emit('close')") {{ $t("dashboard.cancel") }}
            v-btn.bg-secondary.text-white(type="submit") {{ mutableAsset?.id ? $t("dashboard.editAsset") : $t("dashboard.addAsset") }}

</template>
