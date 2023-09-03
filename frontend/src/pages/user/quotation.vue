<template lang="pug">
v-container
  v-row(v-if="quotation")
    v-col(cols='9')
      v-card.pa-4
        v-form(@submit.prevent="handleSubmit")
          v-card-title 
            v-row(align="center")
              v-btn(icon="mdi-arrow-left" variant="text" @click='router.go(-1)')
              span {{ quotation?.id ? $t("quotation.editQuotation") : $t("quotation.createQuotation") }}
          
          v-card-text
            v-row(dense)
              v-col(cols="3" lg="2")
                v-switch(name='tvaApplicable' :label='$t("quotation.vatApplicable")' v-model="quotation.tvaApplicable" @change="updateTotal(quotation)" color="secondary" )
              v-col(cols="3" lg="2")
                v-switch(name='cautionPaid' :label='$t("quotation.paid")' v-model="quotation.cautionPaid" color="secondary" )
              template(v-if="quotation.cautionPaid")
                v-col(cols="3" lg="2")
                  v-select(:items="revenus" item-title="createdAt" item-value="id" name='revenuId' v-model="quotation.RevenuId" :label='$t("quotation.revenu")')
                v-col(cols="3" lg="2")
                  DateInput(:value="quotation.paymentDate")
            v-row
              v-col(cols="3") {{ $t("quotation.reference") }}
              v-col(cols="3") {{ $t("quotation.priceUnit") }}
              v-col(cols="3") {{ $t("quotation.quantity") }}
              v-col(cols="2") {{ $t("quotation.total") }}
              v-col(cols="1")
            br
            transition-group(name='slide-up')
              div(v-for='(item, index) in quotation.InvoiceItems' :key="item.id || index")
                v-row(v-if="item?.markedForDestruction !== true")
                  v-col(cols="3")
                    v-text-field(v-model="item.name" :rules="[$v.required()]")
                  v-col(cols="3")
                    v-text-field(v-model.number="item.unit" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="3")
                    v-text-field(v-model.number="item.quantity" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="2")
                    v-text-field(v-model="item.total" :disabled='true')
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
        :initial-total='itemsTotal || quotation.total',
        :initial-tva-applicable='quotation.tvaApplicable',
        :initial-tva-amount='tvaAmount || quotation.tvaAmount'
        :initial-total-t-t-c='totalTTC || quotation.totalTTC',
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
import type { Customers, Revenus, Prisma } from "../../../types/models";

type QuotationWithInvoiceItems = Prisma.QuotationsUncheckedCreateInput & {
  InvoiceItems: Prisma.InvoiceItemsCreateInput[];
};
const loadingStore = useLoadingStore();
const route = useRoute();
const router = useRouter();
const quotation = ref<QuotationWithInvoiceItems>();
const customer = ref<Customers>();
const revenus = ref<Revenus[]>([]);
const customerId = route.params.customerId;
const { itemsTotal, totalTTC, tvaAmount } = useTotal();
const quotationItemTemplate: Prisma.InvoiceItemsUncheckedCreateInput = {
  quantity: 0,
  name: "",
  unit: 0,
  total: 0,
};

onMounted(async () => {
  const setupPromises = [getCustomer(customerId), getRevenuIds({ BankId: 1 })];
  if (route.params.id) setupPromises.push(getQuotation(customerId, route.params.id));

  loadingStore.setLoading(true);

  Promise.all(setupPromises).then((data) => {
    customer.value = data[0];
    if (!customer.value) return;
    revenus.value = data[1];

    if (data.length > 2) {
      quotation.value = { ...data[2] };
      if (quotation.value) {
        quotation.value.paymentDate = dayjs(quotation.value.paymentDate || undefined).toDate();
        quotationItemTemplate.QuotationId = quotation.value.id;
      }
    } else {
      quotation.value = {
        firstName: customer.value.firstName,
        lastName: customer.value.lastName,
        company: customer.value.company,
        address: customer.value.address,
        city: customer.value.city,
        paymentDate: null,
        total: 0,
        tvaAmount: 0,
        tvaApplicable: false,
        cautionPaid: false,
        CustomerId: customer.value.id,
        RevenuId: null,
        InvoiceItems: [],
      };
    }
    loadingStore.setLoading(false);
  });
});

function updateTotal(item) {
  if (!quotation.value) return;
  item.total = item.quantity * item.unit;
  quotation.value.total = quotation.value.InvoiceItems?.reduce((sum, quotation) => sum + quotation.total, 0);
  if (quotation.value.tvaApplicable) {
    quotation.value.tvaAmount = quotation.value.total * 0.2;
  }
  quotation.value.totalTTC = quotation.value.total + quotation.value.tvaAmount;
}

function addItem() {
  if (!quotation.value) return;
  if (!quotation.value.InvoiceItems) quotation.value.InvoiceItems = [];
  quotation.value.InvoiceItems.push({ ...quotationItemTemplate });
}

function removeItem(item) {
  if (!quotation.value) return;
  const index = quotation.value.InvoiceItems.findIndex((quotationItem) => quotationItem.id === item.id);
  quotation.value.InvoiceItems.splice(index, 1);
  quotation.value.InvoiceItems?.reduce((sum, quotation) => sum + quotation.total, 0);
  updateTotal(item);
}

async function handleSubmit(): Promise<void> {
  if (!quotation.value) return;
  loadingStore.setLoading(true);
  try {
    if (quotation.value.id) {
      await updateQuotation(quotation.value.CustomerId, quotation.value.id, quotation.value);
      useMessageStore().i18nMessage("success", "quotations.updated");
    } else {
      await createQuotation(quotation.value.CustomerId, quotation.value);
      useMessageStore().i18nMessage("success", "quotations.created");
    }
    router.push({ path: `/customers/${customerId}` });
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
