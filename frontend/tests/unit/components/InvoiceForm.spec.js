import InvoiceForm from "@/components/InvoiceForm";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";
import flushPromises from "flush-promises";
import waitForExpect from "wait-for-expect";

const store = createStore();

store.dispatch = jest.fn();

function factory(id = undefined) {
  return mount(InvoiceForm, {
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
      initialInvoice: {
        id: id,
      },
    },
    global: {
      plugins: [store],
    },
  });
}

function invoiceFactory(wrapper) {
  return {
    CustomerId: wrapper.props("customer").id,
    address: "",
    city: "",
    company: wrapper.props("customer").company,
    firstName: wrapper.props("customer").firstName,
    lastName: wrapper.props("customer").lastName,
    total: 0,
    id: wrapper.props("initialInvoice").id,
    paid: undefined,
    paymentDate: undefined,
    revenuId: undefined,
    tvaApplicable: undefined,
    InvoiceItems: [
      {
        InvoiceId: wrapper.props("initialInvoice").id,
        _destroy: false,
        name: "",
        quantity: 0,
        total: 0,
        unit: 0,
      },
    ],
  };
}

describe("CREATE InvoiceForm.vue", () => {
  let wrapper;
  let invoice;
  beforeEach(() => {
    wrapper = factory();
    invoice = invoiceFactory(wrapper);
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("if isNew submit creates new invoice then redirects", async () => {
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("createInvoice", invoice);
      expect(wrapper.router.push).toHaveBeenCalledWith({
        name: "CustomerEdit",
        params: { id: wrapper.props("customer").id },
      });
    });
  });
});

describe("UPDATE InvoiceForm.vue", () => {
  let wrapper;
  let invoice;
  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = factory(1);
    invoice = invoiceFactory(wrapper);
    wrapper.props("initialInvoice").paymentDate = new Date();
    invoice.paymentDate = new Date();
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("if !isNew submit updates invoice then redirects", async () => {
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("updateInvoice", invoice);
      expect(wrapper.router.push).toHaveBeenCalledWith({
        name: "CustomerEdit",
        params: { id: wrapper.props("customer").id },
      });
    });
  });
});
