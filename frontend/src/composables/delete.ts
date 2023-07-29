export function useDelete(callback: (id: string, CustomerId?: string) => Promise<any>) {
  async function deleteItem(item: { id: string; CustomerId: string }, confirmString: string) {
    const { CustomerId, id } = item;
    const result = confirm(confirmString);
    if (result) CustomerId ? await callback(CustomerId, id) : await callback(id);
  }

  return { deleteItem };
}
