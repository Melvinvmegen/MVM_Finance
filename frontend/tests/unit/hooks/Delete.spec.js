import useDelete from "@/hooks/delete.ts";

describe("", () => {
  xit("", () => {
    global.confirm = () => true;
    const { deleteItem } = useDelete();
    const invoice = { id: 1 };
    const itemName = "Invoice";
    const spyDispatch = jest.spyOn(store, "dispatch").mockImplementation();
    deleteItem(
      invoice,
      itemName,
      `Vous êtes sur de vouloir supprimer la facture ${invoice.id}`
    );

    expect(spyDispatch).toHaveBeenCalledWith(`delete${itemName}`, invoice.id);
  });
});
