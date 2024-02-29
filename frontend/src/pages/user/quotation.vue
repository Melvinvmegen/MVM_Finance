<template lang="pug">
v-container
  v-row(v-if="quotation")
    v-col(cols='9')
      v-card.pa-4
        v-form(v-model="valid" @submit.prevent="handleSubmit")
          v-card-title 
            v-row(align="center")
              v-btn(icon="mdi-arrow-left" variant="text" @click='router.go(-1)')
              span {{ quotation?.id ? $t("quotation.editQuotation") : $t("quotation.createQuotation") }}
          
          v-card-text
            v-row(dense)
              v-col(cols="3" lg="2")
                v-switch(:label='$t("quotation.vatApplicable")' v-model="quotation.tva_applicable" @change="updateTotal(quotation)" color="secondary" )
              v-col(cols="3" lg="2")
                v-switch(:label='$t("quotation.paid")' v-model="quotation.caution_paid" color="secondary" )
              template(v-if="quotation.caution_paid")
                v-col(cols="4" lg="3" xl="2")
                  v-select(:items="revenus" :item-props="itemProps" name='revenuId' v-model="quotation.revenu_id" :label='$t("quotation.revenu")' :rules="[$v.required()]")
                v-col(cols="4" lg="3" xl="2")
                  DateInput(v-model="quotation.payment_date")
            v-row
              v-col(cols="3") {{ $t("quotation.reference") }}
              v-col(cols="3") {{ $t("quotation.priceUnit") }}
              v-col(cols="3") {{ $t("quotation.quantity") }}
              v-col(cols="2") {{ $t("quotation.total") }}
              v-col(cols="1")
            br
            transition-group(name='slide-up' v-if="quotation.invoice_items.length")
              div(v-for='(item, index) in quotation.invoice_items' :key="item.id || index")
                v-row(v-if="item?.markedForDestruction !== true")
                  v-col(cols="3")
                    v-text-field(v-model="item.name" :rules="[$v.required()]")
                  v-col(cols="3")
                    NumberInput(v-model="item.unit" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="3")
                    NumberInput(v-model="item.quantity" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="2")
                    v-text-field(v-model="item.total" disabled)
                  v-col(cols="1")
                    v-btn(color="error" @click.prevent='removeItem(item)')
                      v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(color="primary" @click.prevent='addItem')
                  span {{ $t("quotation.addLigne") }}


          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn.bg-secondary.text-white(type="submit") {{ quotation?.id ? $t("quotation.editQuotation") : $t("quotation.createQuotation") }}
    v-col(cols='3')
      TotalField(
        :initial-total='items_total || quotation.total',
        :initial-tva-applicable='quotation.tva_applicable',
        :initial-tva-amount='tva_amount || quotation.tva_amount'
        :initial-total-t-t-c='total_ttc || quotation.total_ttc',
        :model='quotation')
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import {
  getCustomer,
  getQuotation,
  createQuotation,
  updateQuotation,
  getRevenuIds,
} from "../../utils/generated/api-user";
import type { customer, revenu, Prisma } from "../../../types/models";

type QuotationWithInvoiceItems = Prisma.quotationUncheckedCreateInput & {
  invoice_items: Prisma.invoice_itemCreateInput[];
};
const loadingStore = useLoadingStore();
const route = useRoute();
const valid = ref(false);
const router = useRouter();
const quotation = ref<QuotationWithInvoiceItems>();
const customer = ref<customer>();
const revenus = ref<revenu[]>([]);
const customer_id = route.params.customer_id;
const { items_total, total_ttc, tva_amount } = useTotal();
const quotationItemTemplate: Prisma.invoice_itemUncheckedCreateInput = {
  quantity: 0,
  name: "",
  unit: 0,
  total: 0,
};

onMounted(async () => {
  const setupPromises = [getCustomer(customer_id), getRevenuIds()];
  if (route.params.id) setupPromises.push(getQuotation(customer_id, route.params.id));

  loadingStore.setLoading(true);

  Promise.all(setupPromises).then((data) => {
    customer.value = data[0];
    if (!customer.value) return;
    revenus.value = data[1];

    if (data.length > 2) {
      quotation.value = { ...data[2] };
      if (quotation.value) {
        quotation.value.payment_date = quotation.value.caution_paid
          ? dayjs(quotation.value.payment_date || undefined).toDate()
          : null;
        quotationItemTemplate.quotation_id = quotation.value.id;
      }
    } else {
      quotation.value = {
        first_name: customer.value.first_name,
        last_name: customer.value.last_name,
        company: customer.value.company,
        address: customer.value.address,
        city: customer.value.city,
        vat_number: customer.value.vat_number,
        payment_date: null,
        total: 0,
        tva_amount: 0,
        tva_applicable: false,
        caution_paid: false,
        customer_id: customer.value.id,
        revenu_id: null,
        invoice_items: [],
      };
    }
    loadingStore.setLoading(false);
  });
});

watch(
  () => quotation.value?.revenu_id,
  (new_revenu_id) => {
    if (!quotation.value) return;
    const revenu = revenus.value.find((r) => r.id === new_revenu_id);
    if (!revenu) return;
    quotation.value.payment_date = dayjs(revenu.created_at).toDate();
  },
);

watch(
  () => quotation.value?.caution_paid,
  () => {
    if (!quotation.value || quotation.value?.caution_paid) return;
    quotation.value.payment_date = null;
    quotation.value.revenu_id = null;
  },
);

function itemProps(item) {
  return {
    title: dayjs(item.created_at).format("MMMM YYYY"),
    value: item.id,
  };
}

function updateTotal(item) {
  if (!quotation.value) return;
  item.total = item.quantity * item.unit;
  quotation.value.total = quotation.value.invoice_items?.reduce((sum, quotation) => sum + quotation.total, 0);
  if (quotation.value.tva_applicable) {
    quotation.value.tva_amount = quotation.value.total * 0.2;
  }
  quotation.value.total_ttc = quotation.value.total + quotation.value.tva_amount;
}

function addItem() {
  if (!quotation.value) return;
  if (!quotation.value.invoice_items) quotation.value.invoice_items = [];
  quotation.value.invoice_items.push({ ...quotationItemTemplate });
}

function removeItem(item) {
  if (!quotation.value) return;
  const index = quotation.value.invoice_items.findIndex((quotationItem) => quotationItem.id === item.id);
  quotation.value.invoice_items.splice(index, 1);
  quotation.value.invoice_items?.reduce((sum, quotation) => sum + quotation.total, 0);
  updateTotal(item);
}

async function handleSubmit(): Promise<void> {
  if (!valid.value || !quotation.value) return;
  loadingStore.setLoading(true);
  try {
    if (quotation.value.id) {
      await updateQuotation(quotation.value.customer_id, quotation.value.id, quotation.value);
      useMessageStore().i18nMessage("success", "quotations.updated");
    } else {
      await createQuotation(quotation.value.customer_id, quotation.value);
      useMessageStore().i18nMessage("success", "quotations.created");
    }
    router.push({ path: `/customers/${customer_id}` });
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
