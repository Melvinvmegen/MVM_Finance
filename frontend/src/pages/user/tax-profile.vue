<template lang="pug">
v-container
  v-row(v-if="tax_profile")
    v-col(cols='9')
      v-card.pa-4
        v-card-title 
          v-row.mb-4(align="center")
            v-col.text-uppercase(cols="10") {{ $t("tax_profile.title", [dayjs().format("YYYY")]) }}
            v-spacer  
            v-col(cols="2" class="d-flex justify-center align-center")
              v-btn(icon="mdi-restore" color="primary" @click="refreshUserStats")

        v-card-text(v-if="tax_profile")
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle {{ $t("tax_profile.salary") }}
            v-card-title {{ $n(tax_profile.salary, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle 
              span {{ $t("tax_profile.taxes") }}
              v-tooltip(:text="$t('tax_profile.taxes_info')")
                template(v-slot:activator="{ props }")
                  v-btn(v-bind="props" icon="mdi-information-outline" variant="plain" size="small")
            v-card-title {{ "-" + $n(tax_profile.salary - tax_profile.salary_net, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle  {{ $t("tax_profile.salary_net") }}
            v-card-title {{ $n(tax_profile.salary_net, "currency") }}
          hr.mx-2.my-4
          v-row.ml-2.mr-2(justify="space-between" align="center")(v-if="tax_profile.bnc_pro")
            v-card-subtitle 
              span {{ $t("tax_profile.bnc_pro") }}
              v-tooltip(:text="$t('tax_profile.bnc_pro-info')")
                template(v-slot:activator="{ props }")
                  v-btn(v-bind="props" icon="mdi-information-outline" variant="plain" size="small")
            v-card-title {{ $n(tax_profile.bnc_pro, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle  
              span {{ $t("tax_profile.taxes", [$n(tax_profile.tax_rate_mean, "currency")]) }}
              v-tooltip(:text="$t('tax_profile.tax_bnc_info', [$n(tax_profile.tax_rate_mean, 'currency')])")
                template(v-slot:activator="{ props }")
                  v-btn(v-bind="props" icon="mdi-information-outline" variant="plain" size="small")
            v-card-title {{ "-" + $n(tax_profile.bnc_pro - tax_profile.bnc_net, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")(v-if="tax_profile.bnc_net")
            v-card-subtitle  {{ $t("tax_profile.bnc_net") }}
            v-card-title {{ $n(tax_profile.bnc_net, "currency") }}
          hr.mx-2.my-4
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle  {{ $t("tax_profile.income_global") }}
            v-card-title {{ $n(tax_profile.income_global, "currency") }}
          hr.mx-2.my-4
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle  {{ $t("tax_profile.income_net_global") }}
            v-card-title {{ $n(tax_profile.income_net_global, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle  {{ $t("tax_profile.income_taxable") }}
            v-card-title {{ $n(tax_profile.income_taxable, "currency") }}
          template(v-if="tax_profile.decote || tax_profile.tax_withholded")
            hr.mx-2.my-4
            v-row.ml-2.mr-2(justify="space-between" align="center" )
              v-card-subtitle  {{ $t("tax_profile.tax_amount") }}
              v-card-title {{ $n(tax_profile.tax_amount, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")(v-if="tax_profile.decote")
            v-card-subtitle  {{ $t("tax_profile.decote") }}
            v-card-title {{ $n(tax_profile.decote, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center")(v-if="tax_profile.decote || tax_profile.tax_withholded")
            v-card-subtitle  {{ $t("tax_profile.tax_amount_net") }}
            v-card-title {{ $n(tax_profile.tax_amount_net, "currency") }}
          v-row.ml-2.mr-2(justify="space-between" align="center" v-if="tax_profile.tax_withholded")
            v-card-subtitle  {{ $t("tax_profile.tax_withholded") }}
            v-card-title {{ $n(tax_profile.tax_withholded, "currency") }}
          hr.mx-2.my-4
          v-row.ml-2.mr-2(justify="space-between" align="center")
            v-card-subtitle  {{ $t("tax_profile.tax_total") }}
            v-card-title {{ $n(tax_profile.tax_amount_net + tax_profile.tax_withholded, "currency") }}

    v-col(cols='3')
      v-card.pa-4
        v-form(v-model="valid" @submit.prevent="handleSubmit")
          v-card-title 
            v-row.mb-4(align="center")
              span {{ $t("tax_profile.config", [dayjs().format("YYYY")]) }}
          v-card-text
            v-row(dense)
              v-col(cols="12")
                v-switch(hide-details :label='$t("tax_profile.withholding_tax_active")' v-model="tax_profile.withholding_tax_active" color="secondary")
              v-col(cols="12")
                v-switch(hide-details :label='$t("tax_profile.fees_declared")' v-model="tax_profile.fees_declared" color="secondary")
              v-col(cols="12")
                NumberInput(:label='$t("tax_profile.fiscal_revenu")' :value='tax_profile.fiscal_revenu' disabled)
              v-col(cols="12")
                NumberInput(:label='$t("tax_profile.tax_rate_mean")' :value='tax_profile.tax_rate_mean' disabled)
              v-col(cols="12")
                NumberInput(:label='$t("tax_profile.tax_rate_marginal")' :value='tax_profile.tax_rate_marginal' disabled)
              v-col(cols="12")
                NumberInput(:label='$t("tax_profile.parts_number")' v-model='tax_profile.parts_number' :rules="[$v.required(),$v.number()]")
              v-col(cols="12")
                NumberInput(:label='$t("tax_profile.deduction_percent")' v-model='tax_profile.deduction_percent' :rules="[$v.required(),$v.number()]")              

          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn.bg-secondary.text-white(type="submit") {{ $t("tax_profile.update") }}

    v-col(cols='12')
      v-card.pa-4
        v-form(v-model="valid_simulation" @submit.prevent="simulate")
          v-card-title 
            v-row.mb-4(align="center")
              span {{ $t("tax_profile.simulate_title", [dayjs().format("YYYY")]) }}
          v-card-text(v-if="simulated_tax_profile")
            v-row(dense)
              v-col(cols="6")
                NumberInput(:label='$t("tax_profile.income_global")' v-model='simulated_tax_profile.income_global' :rules="[$v.required(),$v.number()]")              
              v-col(cols="6")
                NumberInput(:label='$t("tax_profile.parts_number")' v-model='simulated_tax_profile.parts_number' :rules="[$v.required(),$v.number()]")
              v-col(cols="6")
                NumberInput(:label='$t("tax_profile.deduction_percent")' v-model='simulated_tax_profile.deduction_percent' :rules="[$v.required(),$v.number()]")              
              v-col(cols="6")
                NumberInput(:label='$t("tax_profile.tax_rate_mean")' v-model='simulated_tax_profile.tax_rate_mean' :rules="[$v.required(),$v.number()]")              
          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn.bg-secondary.text-white(type="submit") {{ $t("tax_profile.simulate") }}
</template>

<script setup lang="ts">
import { updateTaxProfile, getTaxProfile, simulateTaxProfile } from "../../utils/generated/api-user";
import { setUsersStats } from "../../utils/generated/api-cron";
import type { tax_profile } from "../../../types/models";
import dayjs from "dayjs";

const loadingStore = useLoadingStore();
const tax_profile = ref<tax_profile>();
const simulated_tax_profile = ref<tax_profile>();
const valid = ref(false);
const valid_simulation = ref(false);

onMounted(async () => {
  loadingStore.setLoading(true);
  tax_profile.value = await getTaxProfile();
  simulated_tax_profile.value = tax_profile.value;
  loadingStore.setLoading(false);
});

async function handleSubmit(item) {
  if (!valid.value || !tax_profile.value) return;
  loadingStore.setLoading(true);
  try {
    await updateTaxProfile(tax_profile.value.id, tax_profile.value);
    useMessageStore().i18nMessage("success", "tax_profile.updated");
    window.location.reload();
  } finally {
    loadingStore.setLoading(false);
  }
}

async function refreshUserStats(value) {
  loadingStore.setLoading(true);
  try {
    await setUsersStats({
      user_ids: [tax_profile.value?.user_id],
    });
  } catch (err) {
    console.error(err);
  } finally {
    loadingStore.setLoading(false);
  }
}

async function simulate(): Promise<void> {
  if (!valid_simulation.value || !tax_profile.value) return;
  loadingStore.setLoading(true);
  try {
    tax_profile.value = await simulateTaxProfile(tax_profile.value.id, simulated_tax_profile.value);
    useMessageStore().i18nMessage("success", "tax_profile.simulated");
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
