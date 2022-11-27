import RevenuForm from "@/components/RevenuForm";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";
import flushPromises from "flush-promises";
import waitForExpect from "wait-for-expect";

const store = createStore();

store.dispatch = jest.fn();

describe("RevenuForm.vue", () => {
  it("submitting the form throws dispatch && push to dashboard", async () => {
    const wrapper = mount(RevenuForm, {
      props: {
        initialRevenu: {
          id: 1,
          Invoices: [],
          Costs: [],
          Quotations: [],
          Credits: [],
          Transactions: [],
          total: 0,
        },
      },
      global: {
        plugins: [store],
      },
    });
    await wrapper.find("#taxPercentage").setValue("20");
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("updateRevenu", {
        id: 1,
        taxPercentage: "20",
        total: 0,
      });
      expect(wrapper.router.push).toHaveBeenCalledWith({ name: "dashboard" });
    });
  });
});
