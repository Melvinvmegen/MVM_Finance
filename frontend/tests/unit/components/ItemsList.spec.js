import ItemList from "@/components/itemsList";
import { mount } from "@vue/test-utils";

function factory(props) {
  return mount(ItemList, {
    props,
  });
}

describe("ItemList.vue", () => {
  it("component emits total at 0", () => {
    const wrapper = factory({
      itemTemplate: {
        quantity: 0,
        name: "",
        unit: 0,
        total: 0,
        markedForDestruction: false,
        invoiceId: 1,
      },
    });

    expect(wrapper.emitted().change[0][0]).toBe(0);
  });

  it("component emits total based on initialItems", () => {
    const wrapper = factory({
      itemTemplate: {
        quantity: 0,
        name: "",
        unit: 0,
        total: 0,
        markedForDestruction: false,
        invoiceId: 1,
      },
      initialItems: [
        { id: 1, total: 100 },
        { id: 2, total: 200 },
        { id: 3, total: 300 },
      ],
    });

    expect(wrapper.emitted().change[0][0]).toBe(600);
  });

  it("add items to the list", async () => {
    const wrapper = factory({
      itemTemplate: {
        quantity: 0,
        name: "",
        unit: 0,
        total: 0,
        markedForDestruction: false,
        invoiceId: 1,
      },
    });
    wrapper.vm.addItem = jest.fn();
    await wrapper.find(".btn-gray").trigger("click");

    expect(wrapper.vm.mutableItems.length).toBe(2);
  });
});
