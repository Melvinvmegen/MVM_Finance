import ListItem from "@/components/listItem";
import { mount } from "@vue/test-utils";

function factory() {
  return mount(ListItem, {
    props: {
      item: {
        id: 1,
        total: 0,
        _destroy: false,
      },
      modelName: "Invoice",
      index: 1,
    },
    global: {
      provide: {
        parentModelName: "Invoice",
      },
    },
  });
}

describe("ListItem.vue", () => {
  it("click on btn danger destroys the item", async () => {
    const wrapper = factory();

    await wrapper.find(".btn-danger").trigger("click");
    expect(wrapper.emitted().change[0][0]).toEqual({
      _destroy: true,
      id: 1,
      total: 0,
    });
  });

  it("Has dynamic field names", () => {
    const wrapper = factory();

    const idFieldName = wrapper.vm.nameFor("id");
    const idParentFieldName = wrapper.vm.nameFor(
      `${wrapper.vm.parentModelName}Id`
    );

    expect(idFieldName).toEqual("Invoice[1]id");
    expect(idParentFieldName).toEqual("Invoice[1]InvoiceId");
  });
});
