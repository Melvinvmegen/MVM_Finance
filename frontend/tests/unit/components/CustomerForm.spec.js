import CustomerForm from "@/components/CustomerForm";
import { mount } from "@vue/test-utils";
import { createStore } from "vuex";
import flushPromises from "flush-promises";
import waitForExpect from "wait-for-expect";

const store = createStore();

store.dispatch = jest.fn();
store.setLoading = jest.fn();

function factory(initialCustomer = { id: undefined }) {
  return mount(CustomerForm, {
    props: {
      initialCustomer,
    },
    global: {
      plugins: [store],
    },
  });
}

function customerFactory(wrapper) {
  return {
    id: wrapper.props("initialCustomer").id,
    lastName: "Doe",
    firstName: "John",
    email: "john.doe@gmail.com",
    phone: "0712345678",
    company: "test",
  };
}

describe("CustomerForm.vue", () => {
  it("if isNew submit creates new customer then redirects", async () => {
    const wrapper = factory();
    const customer = customerFactory(wrapper);
    await wrapper.find("#lastname").setValue(customer.lastName);
    await wrapper.find("#firstname").setValue(customer.firstName);
    await wrapper.find("#email").setValue(customer.email);
    await wrapper.find("#phone").setValue(customer.phone);
    await wrapper.find("#company").setValue(customer.company);
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("createCustomer", customer);
      expect(wrapper.router.push).toHaveBeenCalledWith("/admin");
    });
  });

  it("if !isNew submit updates customer then redirects", async () => {
    const wrapper = factory({ id: 1 });
    const customer = customerFactory(wrapper);
    await wrapper.find("#lastname").setValue(customer.lastName);
    await wrapper.find("#firstname").setValue(customer.firstName);
    await wrapper.find("#email").setValue(customer.email);
    await wrapper.find("#phone").setValue(customer.phone);
    await wrapper.find("#company").setValue(customer.company);
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("updateCustomer", customer);
      expect(wrapper.router.push).toHaveBeenCalledWith("/admin");
    });
  });
});
