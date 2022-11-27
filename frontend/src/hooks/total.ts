import { ref } from "vue";

export default function useTotal() {
  const itemsTotal = ref(0);
  const totalTTC = ref(0);
  const tvaAmount = ref(0);

  function setTotal(total: number) {
    itemsTotal.value = total;
    totalTTC.value = +(itemsTotal.value * 1.2).toFixed(2);
    tvaAmount.value = +(totalTTC.value - itemsTotal.value).toFixed(2);
  }

  return { setTotal, itemsTotal, totalTTC, tvaAmount };
}
