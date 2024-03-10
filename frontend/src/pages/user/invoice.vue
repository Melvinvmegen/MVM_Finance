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
                v-switch(hide-details :label='$t("invoice.vatApplicable")' v-model="invoice.tva_applicable" @change="updateTotal(invoice)" color="secondary")
              v-col(cols="3" lg="2")
                v-switch(hide-details :label='$t("invoice.paid")' v-model="invoice.paid" color="secondary")
              v-col(cols="3" lg="2")
                v-switch(hide-details :label='$t("invoice.recurrent")' v-model="invoice.recurrent" color="secondary")
              template(v-if="invoice.paid")
                v-col(cols="4" lg="3" xl="2")
                  v-select(:items="revenus" hide-details :item-props="itemProps" name='revenuId' v-model="invoice.revenu_id" :label='$t("invoice.revenu")' :rules="[$v.required()]")
                v-col(cols="4" lg="3" xl="2")
                  DateInput(v-model="invoice.payment_date")
            v-row(v-if="invoice.invoice_items.length")
              v-col(cols="3") {{ $t("invoice.reference") }}
              v-col(cols="3") {{ $t("invoice.priceUnit") }}
              v-col(cols="3") {{ $t("invoice.quantity") }}
              v-col(cols="2") {{ $t("invoice.total") }}
              v-col(cols="1")
            br
            transition-group(name='slide-up' v-if="invoice.invoice_items.length")
              div(v-for='(item, index) in invoice.invoice_items' :key="index")
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
        :initial-total='items_total || invoice.total',
        :initial-tva-applicable='invoice.tva_applicable',
        :initial-tva-amount='tva_amount || invoice.tva_amount'
        :initial-total-t-t-c='total_ttc || invoice.total_ttc',
        :model='invoice'
      )
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { getCustomer, getInvoice, createInvoice, updateInvoice, getRevenuIds } from "../../utils/generated/api-user";
import type { customer, revenu, Prisma } from "../../../types/models";

type InvoiceWithInvoiceItems = Prisma.invoiceUncheckedCreateInput & {
  invoice_items: Prisma.invoice_itemCreateInput[];
};
const loadingStore = useLoadingStore();
const route = useRoute();
const router = useRouter();
const invoice = ref<InvoiceWithInvoiceItems>();
const customer = ref<customer>();
const revenus = ref<revenu[]>([]);
const valid = ref(false);
const customer_id = route.params.customer_id;
const { items_total, total_ttc, tva_amount } = useTotal();
const invoiceItemTemplate: Prisma.invoice_itemUncheckedCreateInput = {
  quantity: 0,
  name: "",
  unit: 0,
  total: 0,
};

onMounted(async () => {
  const setupPromises = [getCustomer(customer_id), getRevenuIds()];
  if (route.params.id) setupPromises.push(getInvoice(customer_id, route.params.id));

  loadingStore.setLoading(true);
  await Promise.all(setupPromises).then((data) => {
    customer.value = data[0];
    if (!customer.value) return;
    revenus.value = data[1];

    if (data.length > 2) {
      invoice.value = data[2];
      if (invoice.value) {
        invoice.value.payment_date = invoice.value.paid ? dayjs(invoice.value.payment_date || undefined).toDate() : null;
        invoiceItemTemplate.invoice_id = invoice.value.id;
      }
    } else {
      invoice.value = {
        first_name: customer.value.first_name,
        last_name: customer.value.last_name,
        company: customer.value.company,
        address: customer.value.address,
        city: customer.value.city,
        vat_number: customer.value.vat_number,
        payment_date: null,
        total: 0,
        total_due: 0,
        total_ttc: 0,
        tva_amount: 0,
        tva_applicable: false,
        paid: false,
        customer_id: customer.value.id,
        revenu_id: null,
        invoice_items: [],
      };
    }
  });

  loadingStore.setLoading(false);
});

watch(
  () => invoice.value?.revenu_id,
  (new_revenu_id) => {
    if (!invoice.value) return;
    const revenu = revenus.value.find((r) => r.id === new_revenu_id);
    if (!revenu) return;
    invoice.value.payment_date = dayjs(revenu.created_at).toDate();
  },
);

watch(
  () => invoice.value?.paid,
  () => {
    if (!invoice.value || invoice.value?.paid) return;
    invoice.value.payment_date = null;
    invoice.value.revenu_id = null;
  },
);

function itemProps(item) {
  return {
    title: dayjs(item.created_at).format("MMMM YYYY"),
    value: item.id,
  };
}

function updateTotal(item) {
  if (!invoice.value) return;
  item.total = item.quantity * item.unit;
  invoice.value.total = invoice.value.invoice_items?.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  if (invoice.value.tva_applicable) {
    invoice.value.tva_amount = invoice.value.total * 0.2;
  }
  invoice.value.total_ttc = invoice.value.total + (invoice.value.tva_amount || 0);
}

function addItem() {
  if (!invoice.value) return;
  if (!invoice.value.invoice_items) invoice.value.invoice_items = [];
  invoice.value.invoice_items.push({ ...invoiceItemTemplate });
}

function removeItem(index, item) {
  if (!invoice.value) return;
  invoice.value.invoice_items.splice(index, 1);
  invoice.value.invoice_items?.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  updateTotal(item);
}

async function handleSubmit(): Promise<void> {
  if (!valid.value || !invoice.value) return;
  loadingStore.setLoading(true);
  try {
    if (invoice.value.id) {
      await updateInvoice(invoice.value.customer_id, invoice.value.id, invoice.value);
      useMessageStore().i18nMessage("success", "invoices.updated");
    } else {
      await createInvoice(invoice.value.customer_id, invoice.value);
      useMessageStore().i18nMessage("success", "invoices.created");
    }
    router.push({ path: `/customers/${customer_id}` });
  } finally {
    loadingStore.setLoading(false);
  }
}
</script>
