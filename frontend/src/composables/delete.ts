export function useDelete(callback: (id: string, customer_id?: string) => Promise<void>) {
  async function deleteItem(item: { id: string; customer_id: string }, confirm_string: string) {
    const { customer_id, id } = item;
    const result = confirm(confirm_string);
    if (result) customer_id ? await callback(customer_id, id) : await callback(id);
    window.location.reload();
  }

  return { deleteItem };
}
