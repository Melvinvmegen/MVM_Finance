export default function useDelete(store: any) {
  async function deleteItem(item: { id: number; CustomerId: string }, itemName: string, confirmString: string) {
    const { CustomerId, id } = item;
    const result = confirm(confirmString);
    const functionCall = CustomerId
      ? store[`delete${itemName}`](CustomerId, id)
      : store[`delete${itemName}`](id);
    if (result) return await functionCall;
  }

  return { deleteItem };
}
