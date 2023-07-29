<template lang="pug">
v-container
  v-row
    v-col(cols='9')
      v-card
        v-form(@submit.prevent="handleSubmit")
          v-card-title 
            v-row
              a(@click='router.go(-1)')
                v-icon mdi-arrow-left
              span {{ invoice?.id ? $t("invoice.editInvoice") : $t("invoice.createInvoice") }}
          
          v-card-text
            v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
            v-row(dense)
              v-col(cols="2")
                v-select(:items="revenus" item-title="createdAt" item-value="id" name='revenuId' v-model="invoice.RevenuId" :label='$t("invoice.revenu")'  )
              v-col(cols="2")
                DateInput(:value="invoice.paymentDate")
                v-icon mdi-calendar
              v-col(cols="2")
                v-switch(name='paid' :label='$t("invoice.paid")' v-model="invoice.paid" color="secondary" )
              v-col(cols="2")
                v-switch(name='tvaApplicable' :label='$t("invoice.vatApplicable")' v-model="invoice.tvaApplicable" @change="updateTotal(invoice)" color="secondary" )
            v-row
              v-col(cols="3") {{ $t("invoice.reference") }}
              v-col(cols="2") {{ $t("invoice.priceUnit") }}
              v-col(cols="2") {{ $t("invoice.quantity") }}
              v-col(cols="1") {{ $t("invoice.total") }}
              v-col(cols="1")
            br
            transition-group(name='slide-up')
              div(v-for='(item, index) in invoice.InvoiceItems' :key="item.id || index")
                v-row(v-if="item?.markedForDestruction !== true")
                  v-col(cols="3")
                    v-text-field(:label='$t("invoice.reference")' v-model="item.name" :rules="[$v.required()]")
                  v-col(cols="3")
                    v-text-field(:label='$t("invoice.priceUnit")' v-model.number="item.unit" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="3")
                    v-text-field(:label='$t("invoice.quantity")' v-model.number="item.quantity" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="2")
                    v-text-field(:label='$t("invoice.total")' v-model="item.total" :disabled='true')
                  v-col(cols="1")
                    v-btn(color="error" href='#' @click.prevent='removeItem(item)')
                      v-icon mdi-delete

              v-row
                v-col(cols="12" justify="end")
                  v-btn(color="primary" @click.prevent='addItem')
                    span + {{ $t("invoice.addLigne") }}


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
import type { Customers, Invoices, Revenus } from "../../../types/models";

const props = defineProps({
  id: [Number, String],
});
const indexStore = useIndexStore();
const customerStore = useCustomerStore();
const invoiceStore = useInvoiceStore();
const revenuStore = useRevenuStore();
const route = useRoute();
const router = useRouter();
const invoice = ref<Invoices | any>({
  firstName: "",
  lastName: "",
  company: "",
  address: "",
  city: "",
  CustomerId: null,
  total: 0,
  tvaAmount: 0,
  tvaApplicable: false,
  totalTTC: 0,
});
const customer = ref<Customers | any>({});
const revenus = ref<Revenus | any>([]);
const customerId = route.query.customerId;
const { itemsTotal, totalTTC, tvaAmount } = useTotal();
const invoiceItemTemplate = {
  quantity: 0,
  name: "",
  unit: 0,
  total: 0,
  InvoiceId: null,
};
const setupPromises = [customerStore.getCustomer(customerId), revenuStore.getRevenus({ BankId: 1 })];
if (props.id) setupPromises.push(invoiceStore.getInvoice(customerId, props.id));

indexStore.setLoading(true);

Promise.all(setupPromises).then((data) => {
  customer.value = data[0];
  revenus.value = data[1];

  if (data.length > 2) {
    invoice.value = <Invoices>{ ...data[2] };
    invoice.value.paymentDate = new Date(invoice.value.paymentDate);
    invoiceItemTemplate.InvoiceId = invoice.value.id;
  } else {
    invoice.value.firstName = customer.value.firstName;
    invoice.value.lastName = customer.value.lastName;
    invoice.value.company = customer.value.company;
    invoice.value.address = customer.value.address;
    invoice.value.city = customer.value.city;
    invoice.value.CustomerId = customer.value.id;
  }
  indexStore.setLoading(false);
});

function updateTotal(item) {
  item.total = item.quantity * item.unit;
  invoice.value.total = invoice.value.InvoiceItems?.reduce((sum, invoice) => sum + invoice.total, 0);
  if (invoice.value.tvaApplicable) {
    invoice.value.tvaAmount = invoice.value.total * 0.2;
  }
  invoice.value.totalTTC = invoice.value.total + invoice.value.tvaAmount;
}

function addItem() {
  if (!invoice.value.InvoiceItems) invoice.value.InvoiceItems = [];
  invoice.value.InvoiceItems.push({ ...invoiceItemTemplate });
}

function removeItem(item) {
  const index = invoice.value.InvoiceItems.findIndex((invoice_item) => invoice_item.id === item.id);
  invoice.value.InvoiceItems.splice(index, 1);
  invoice.value.InvoiceItems?.reduce((sum, invoice) => sum + invoice.total, 0);
  updateTotal(item);
}

async function handleSubmit(): Promise<void> {
  indexStore.setLoading(true);
  const action = invoice.value.id ? "updateInvoice" : "createInvoice";
  try {
    const res = await invoiceStore[action](invoice.value);
    if (res && customerId) {
      router.push({ path: `/customers/edit/${customerId}` });
    }
  } finally {
    indexStore.setLoading(false);
  }
}
</script>
