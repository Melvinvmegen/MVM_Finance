<template lang="pug">
v-container
  v-row
    v-col(cols="12" md="8")
      v-card(elevation="3")
        v-card-title
          v-row(justify="space-between" align="center")
            v-col.text-uppercase(cols="11") Clients
            v-spacer  
            v-col(cols="1" class="d-flex justify-center align-center")
              router-link(:to="'/customers/new'")
                v-btn(icon="mdi-plus" color="primary")

        v-card-text
          customer-table
      .mt-4
      v-card(elevation="3")
        v-card-title
          v-row(justify="space-between" align="center")
            v-col.text-uppercase(cols="11") Revenus
            v-spacer
            v-col(cols="1")
              v-btn(icon="mdi-plus" @click="triggerUpload" color="primary")
              input.mr-2(type="file" id="csv" name="csv" accept=".csv" style="display:none;" @change="uploadFile")

        v-card-text
          revenu-table
    v-col(cols="12" md="4")
      weather
      .mt-4
      crypto-table
</template>

<script setup lang="ts">
import useDelete from "../../hooks/delete";
import type customer from "../types/customer";
import customerTable from "../../components/customer/customerTable";
import revenuTable from "../../components/revenu/revenuTable.vue";
import cryptoTable from "../../components/crypto/cryptoTable.vue";
import weather from "../../components/general/weather.vue";
import { useRouter } from "vue-router";
import { useIndexStore } from "../../store/indexStore.ts"
import { useRevenuStore } from "../../store/revenuStore.ts";
import type Customer from "../../types/customer";
import axios from "axios";

const { deleteItem } = useDelete();
const router = useRouter();
const indexStore = useIndexStore();
const revenuStore = useRevenuStore();

function triggerUpload() {
  document.getElementById('csv').click();
}

async function uploadFile(event) {
  indexStore.setLoading(true); 
  try {
    const form = new FormData();
    form.append("file", event.target.files[0]);
    await revenuStore.createRevenu(form);
  } finally {
    indexStore.setLoading(false);
  }
}
</script>
