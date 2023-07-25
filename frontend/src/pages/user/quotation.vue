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
              span {{ quotation?.id ? "Editer un devis" : "Créer un devis" }}
          
          v-card-text
            v-alert(color="danger" v-if='indexStore.error') {{ indexStore.error }}
            v-row(dense)
              v-col(cols="2")
                v-select(:items="revenus" item-title="createdAt" item-value="id" name='revenuId' v-model="quotation.RevenuId" label='Revenu'  )
              v-col(cols="2")
                DateInput(:value="quotation.paymentDate")
              v-col(cols="2")
                v-switch(name='cautionPaid' label='Payé' v-model="quotation.cautionPaid" color="secondary" )
              v-col(cols="2")
                v-switch(name='tvaApplicable' label='TVA applicable' v-model="quotation.tvaApplicable" @change="updateTotal(quotation)" color="secondary" )
            v-row
              v-col(cols="3") Référence
              v-col(cols="2") Prix unitaire
              v-col(cols="2") Quantité
              v-col(cols="1") Total
              v-col(cols="1")
            br
            transition-group(name='slide-up')
              div(v-for='(item, index) in quotation.InvoiceItems' :key="item.id || index")
                v-row(v-if="item?.markedForDestruction !== true")
                  v-col(cols="3")
                    v-text-field(label='Référence'  v-model="item.name" :rules="[$v.required()]")
                  v-col(cols="3")
                    v-text-field(label='Prix unitaire'  v-model.number="item.unit" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="3")
                    v-text-field(label='Quantité'  v-model.number="item.quantity" @change="updateTotal(item)" :rules="[$v.required(), $v.number()]")
                  v-col(cols="2")
                    v-text-field(label='Total'  v-model="item.total" :disabled='true'  )
                  v-col(cols="1")
                    v-btn(color="error" href='#' @click.prevent='removeItem(item)')
                      v-icon mdi-delete

              v-row
                v-col(cols="12" justify="end")
                  v-btn(color="primary" @click.prevent='addItem')
                    span + Ajouter une ligne


          v-card-actions
            v-row(dense justify="center")
              v-col.d-flex.justify-center(cols="12" lg="8")
                v-btn.bg-secondary.text-white(type="submit") {{ quotation?.id ? "Editer un devis" : "Créer un devis" }}
    v-col(cols='3')
      TotalField(
        :initial-total='itemsTotal || quotation.total',
        :initial-tva-applicable='quotation.tvaApplicable',
        :initial-tva-amount='tvaAmount || quotation.tvaAmount'
        :initial-total-t-t-c='totalTTC || quotation.totalTTC',
        :model='quotation'
      )
</template>

<script setup lang="ts">
import type { Customers, Quotations, Revenus } from "../../../types/models";

const props = defineProps({
  id: [Number, String],
});
const indexStore = useIndexStore();
const customerStore = useCustomerStore();
const quotationStore = useQuotationStore();
const revenuStore = useRevenuStore();
const route = useRoute();
const router = useRouter();
const quotation = ref<Quotations | any>({
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
const quotationItemTemplate = {
  createdAt: new Date(),
  updatedAt: new Date(),
  quantity: 0,
  name: "",
  unit: 0,
  total: 0,
  QuotationId: null,
};
const setupPromises = [customerStore.getCustomer(customerId), revenuStore.getRevenus({ BankId: 1 })];
if (props.id) setupPromises.push(quotationStore.getQuotation(customerId, props.id));

indexStore.setLoading(true);

Promise.all(setupPromises).then((data) => {
  customer.value = data[0];
  revenus.value = data[1];

  if (data.length > 2) {
    quotation.value = <Quotations>{ ...data[2] };
    quotation.value.paymentDate = new Date(quotation.value.paymentDate);
    quotationItemTemplate.QuotationId = quotation.value.id;
  } else {
    quotation.value.firstName = customer.value.firstName;
    quotation.value.lastName = customer.value.lastName;
    quotation.value.company = customer.value.company;
    quotation.value.address = customer.value.address;
    quotation.value.city = customer.value.city;
    quotation.value.CustomerId = customer.value.id;
  }
  indexStore.setLoading(false);
});

function updateTotal(item) {
  item.total = item.quantity * item.unit;
  quotation.value.total = quotation.value.InvoiceItems?.reduce((sum, quotation) => sum + quotation.total, 0);
  if (quotation.value.tvaApplicable) {
    quotation.value.tvaAmount = quotation.value.total * 0.2;
  }
  quotation.value.totalTTC = quotation.value.total + quotation.value.tvaAmount;
}

function addItem() {
  if (!quotation.value.InvoiceItems) quotation.value.InvoiceItems = [];
  quotation.value.InvoiceItems.push({ ...quotationItemTemplate });
}

function removeItem(item) {
  const index = quotation.value.InvoiceItems.findIndex((quotationItem) => quotationItem.id === item.id);
  quotation.value.InvoiceItems.splice(index, 1);
  quotation.value.InvoiceItems?.reduce((sum, quotation) => sum + quotation.total, 0);
  updateTotal(item);
}

async function handleSubmit(): Promise<void> {
  indexStore.setLoading(true);
  const action = quotation.value.id ? "updateQuotation" : "createQuotation";
  if (!quotation.value.createdAt) quotation.value.createdAt = new Date();
  quotation.value.updatedAt = new Date();
  try {
    const res = await quotationStore[action](quotation.value);
    if (res && customerId) {
      router.push({ path: `/customers/edit/${customerId}` });
    }
  } finally {
    indexStore.setLoading(false);
  }
}
</script>
