<template lang="pug">
v-container
  v-row(v-if="invoice")
    v-col(cols='9')
      v-card.pa-4
        v-form(v-model="valid" @submit.prevent="handleSubmit")
          v-card-title 
            v-row.mb-4(align="center")
              v-btn(icon="mdi-arrow-left" variant="text" @click='router.go(-1)')
              span {{ invoice?.id ? $t("invoice.editInvoice") : $t("invoice.createInvoice") }}
          
          v-card-text
            v-row(dense)
              v-col(cols="3" lg="2")
                v-switch(name='tvaApplicable' hide-details :label='$t("invoice.vatApplicable")' v-model="invoice.tvaApplicable" @change="updateTotal(invoice)" color="secondary" )
              v-col(cols="3" lg="2")
                v-switch(name='paid' hide-details :label='$t("invoice.paid")' v-model="invoice.paid" color="secondary" )
              template(v-if="invoice.paid")
                v-col(cols="4" lg="3" xl="2")
                  v-select(:items="revenus" hide-details :item-props="itemProps" name='revenuId' v-model="invoice.RevenuId" :label='$t("invoice.revenu")' :rules="[$v.required()]")
                v-col(cols="4" lg="3" xl="2")
                  DateInput(v-model="invoice.paymentDate")
            v-row(v-if="invoice.InvoiceItems.length")
              v-col(cols="3") {{ $t("invoice.reference") }}
              v-col(cols="3") {{ $t("invoice.priceUnit") }}
              v-col(cols="3") {{ $t("invoice.quantity") }}
              v-col(cols="2") {{ $t("invoice.total") }}
              v-col(cols="1")
            br
            transition-group(name='slide-up' v-if="invoice.InvoiceItems.length")
              div(v-for='(item, index) in invoice.InvoiceItems' :key="index")
                v-row(v-if="item?.markedForDestruction !== true")
                  v-col(cols="3")
                    v-text-field(v-model="item.name" :rules="[$v.required()]")
                  v-col(cols="3")
                    NumberInput(v-model="item.unit" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="3")
                    NumberInput(v-model="item.quantity" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="2")
                    v-text-field(v-model="item.total" :disabled='true')
                  v-col(cols="1")
                    v-btn(color="error" @click.prevent='removeItem(index, item)')
                      v-icon mdi-delete

            v-row
              v-col(cols="12" justify="end")
                v-btn(color="primary" @click.prevent='addItem')
                  span {{ $t("invoice.addLigne") }}


          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn.bg-secondary.text-white(type="submit") {{ invoice?.id ? $t("invoice.editInvoice") : $t("invoice.createInvoice") }}
    v-col(cols='3')
      TotalField(
        :initial-total='itemsTotal || invoice.total',
        :initial-tva-applicable='invoice.tvaApplicable',
        :initial-tva-amount='tvaAmount || invoice.tvaAmount'
        :initial-total-t-t-c='totalTTC || invoice.totalTTC',
        :model='invoice'
      )
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { getCustomer, getInvoice, createInvoice, updateInvoice, getRevenuIds } from "../../utils/generated/api-user";
import type { Customers, Revenus, Prisma } from "../../../types/models";

type InvoiceWithInvoiceItems = Prisma.InvoicesUncheckedCreateInput & {
  InvoiceItems: Prisma.InvoiceItemsCreateInput[];
};
const loadingStore = useLoadingStore();
const route = useRoute();
const router = useRouter();
const invoice = ref<InvoiceWithInvoiceItems>();
const customer = ref<Customers>();
const revenus = ref<Revenus[]>([]);
const valid = ref(false);
const customerId = route.params.customerId;
const { itemsTotal, totalTTC, tvaAmount } = useTotal();
const invoiceItemTemplate: Prisma.InvoiceItemsUncheckedCreateInput = {
  quantity: 0,
  name: "",
  unit: 0,
  total: 0,
};

onMounted(async () => {
  // TODO: this should be made dynamic
  const setupPromises = [getCustomer(customerId), getRevenuIds({ BankId: 1 })];
  if (route.params.id) setupPromises.push(getInvoice(customerId, route.params.id));

  loadingStore.setLoading(true);
  await Promise.all(setupPromises).then((data) => {
    customer.value = data[0];
    if (!customer.value) return;
    revenus.value = data[1];

    if (data.length > 2) {
      invoice.value = data[2];
      if (invoice.value) {
        invoice.value.paymentDate = invoice.value.paid ? dayjs(invoice.value.paymentDate || undefined).toDate() : null;
        invoiceItemTemplate.InvoiceId = invoice.value.id;
      }
    } else {
      invoice.value = {
        firstName: customer.value.firstName,
        lastName: customer.value.lastName,
        company: customer.value.company,
        address: customer.value.address,
        city: customer.value.city,
        paymentDate: null,
        total: 0,
        totalDue: 0,
        totalTTC: 0,
        tvaAmount: 0,
        tvaApplicable: false,
        paid: false,
        CustomerId: customer.value.id,
        RevenuId: null,
        InvoiceItems: [],
      };
    }
  });

  loadingStore.setLoading(false);
});

watch(
  () => invoice.value?.RevenuId,
  (newRevenuId) => {
    if (!invoice.value) return;
    const revenu = revenus.value.find((r) => r.id === newRevenuId);
    if (!revenu) return;
    invoice.value.paymentDate = dayjs(revenu.createdAt).toDate();
  },
);

watch(
  () => invoice.value?.paid,
  () => {
    if (!invoice.value || invoice.value?.paid) return;
    invoice.value.paymentDate = null;
    invoice.value.RevenuId = null;
  },
);

function itemProps(item) {
  return {
    title: dayjs(item.createdAt).format("MMMM YYYY"),
    value: item.id,
  };
}

function updateTotal(item) {
  if (!invoice.value) return;
  item.total = item.quantity * item.unit;
  invoice.value.total = invoice.value.InvoiceItems?.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  if (invoice.value.tvaApplicable) {
    invoice.value.tvaAmount = invoice.value.total * 0.2;
  }
  invoice.value.totalTTC = invoice.value.total + (invoice.value.tvaAmount || 0);
}

function addItem() {
  if (!invoice.value) return;
  if (!invoice.value.InvoiceItems) invoice.value.InvoiceItems = [];
  invoice.value.InvoiceItems.push({ ...invoiceItemTemplate });
}

function removeItem(index, item) {
  if (!invoice.value) return;
  invoice.value.InvoiceItems.splice(index, 1);
  invoice.value.InvoiceItems?.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  updateTotal(item);
}

async function handleSubmit(): Promise<void> {
  if (!valid.value || !invoice.value) return;
  loadingStore.setLoading(true);
  try {
    if (invoice.value.id) {
      await updateInvoice(invoice.value.CustomerId, invoice.value.id, invoice.value);
      useMessageStore().i18nMessage("success", "invoices.updated");
    } else {
      await createInvoice(invoice.value.CustomerId, invoice.value);
      useMessageStore().i18nMessage("success", "invoices.created");
    }
    router.push({ path: `/customers/${customerId}` });
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
