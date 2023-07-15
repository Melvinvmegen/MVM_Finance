import { useIndexStore } from "../store/indexStore";

export function useDownload(store: any) {
  const indexStore = useIndexStore();

  async function downloadPDF(item: { id: number; CustomerId: string }, itemName: string) {
    indexStore.setLoading(true);
    const itemId = item.id;
    const customerId = item.CustomerId;

    const itemNameUpperCase = itemName.charAt(0).toUpperCase() + itemName.slice(1);
    if (itemId && customerId) {
      const response = await store[`get${itemNameUpperCase}PDF`](customerId, itemId);
      const content = response.headers["content-type"];
      // TODO implement custom download
      // download(response.data, `${itemNameUpperCase}-${itemId}`, content);
    }
    indexStore.setLoading(false);
  }

  return { downloadPDF };
}
