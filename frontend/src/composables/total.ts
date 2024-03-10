export function useTotal() {
  const items_total = ref(0);
  const total_ttc = ref(0);
  const tva_amount = ref(0);

  function setTotal(total: number) {
    items_total.value = total;
    total_ttc.value = +(items_total.value * 1.2).toFixed(2);
    tva_amount.value = +(total_ttc.value - items_total.value).toFixed(2);
  }

  return { setTotal, items_total, total_ttc, tva_amount };
}
