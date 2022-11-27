
export default function useDelete(store: any) {
  async function deleteItem(
    item: { id: number },
    itemName: string,
    confirmString: string
  ) {
    const result = confirm(confirmString);
    if (result) {
      return await store[`delete${itemName}`](item.id);
    }
  }

  return { deleteItem };
}
