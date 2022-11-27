import QuotationForm from "@/components/QuotationForm";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";
import flushPromises from "flush-promises";
import waitForExpect from "wait-for-expect";

const store = createStore();

store.dispatch = jest.fn();

function factory(initialQuotation = { id: undefined }) {
  return mount(QuotationForm, {
    props: {
      customer: {
        id: 1,
        lastName: "Doe",
        firstName: "John",
        email: "john.doe@gmail.com",
        phone: "0712345678",
        company: "test",
        address: "",
        city: "",
        siret: "",
      },
      initialQuotation,
    },
    global: {
      plugins: [store],
    },
  });
}

function quotationFactory(wrapper) {
  return {
    CustomerId: wrapper.props("customer").id,
    address: "",
    city: "",
    company: wrapper.props("customer").company,
    firstName: wrapper.props("customer").firstName,
    lastName: wrapper.props("customer").lastName,
    total: 0,
    id: wrapper.props("initialQuotation").id,
    InvoiceItems: [
      {
        QuotationId: wrapper.props("initialQuotation").id,
        _destroy: false,
        name: "",
        quantity: 0,
        total: 0,
        unit: 0,
      },
    ],
  };
}

describe("QuotationForm.vue", () => {
  it("if isNew submit creates new quotation then redirects", async () => {
    const wrapper = factory();
    const quotation = quotationFactory(wrapper);
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("createQuotation", quotation);
      expect(wrapper.router.push).toHaveBeenCalledWith({
        name: "CustomerEdit",
        params: { id: wrapper.props("customer").id },
      });
    });
  });

  it("if !isNew submit updates quotation then redirects", async () => {
    const wrapper = factory({ id: 1 });
    const quotation = quotationFactory(wrapper);
    wrapper.props("initialQuotation").paymentDate = new Date();
    quotation.paymentDate = new Date();
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("updateQuotation", quotation);
      expect(wrapper.router.push).toHaveBeenCalledWith({
        name: "CustomerEdit",
        params: { id: wrapper.props("customer").id },
      });
    });
  });
});
