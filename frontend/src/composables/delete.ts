export function useDelete(callback: (id: string, CustomerId?: string) => Promise<void>) {
  async function deleteItem(item: { id: string; CustomerId: string }, confirmString: string) {
    const { CustomerId, id } = item;
    const result = confirm(confirmString);
    if (result) CustomerId ? await callback(CustomerId, id) : await callback(id);
    window.location.reload();
  }

  return { deleteItem };
}
