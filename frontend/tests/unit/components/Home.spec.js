import { mount } from "@vue/test-utils";
import Home from "@/components/Home";
import flushPromises from "flush-promises";
import waitForExpect from "wait-for-expect";
import { createStore } from "vuex";

const store = createStore({
  modules: {
    auth: {
      state: {
        status: { loggedIn: false },
      },
    },
  },
});

store.dispatch = jest.fn();

function factory() {
  return mount(Home, {
    computed: { loggedIn: () => false },
    global: {
      plugins: [store],
    },
  });
}

describe("Home.vue", () => {
  it("change mode when btn-secondary clicked", async () => {
    const wrapper = factory();

    await wrapper.find(".text-underline").trigger("click");
    expect(wrapper.vm.isAuth).toBe(false);
  });

  it("signIn when isAuth and form submitted clicked", async () => {
    const wrapper = factory();
    await wrapper.find("#email").setValue("john.doe@gmail.com");
    await wrapper.find("#password").setValue("password");
    await wrapper.find("form").trigger("submit.prevent");

    await flushPromises();
    await waitForExpect(() => {
      expect(store.dispatch).toHaveBeenCalledWith("auth/signIn", {
        email: "john.doe@gmail.com",
        password: "password",
      });
      expect(wrapper.router.push).toHaveBeenCalledWith("/admin");
    });
  });

  it("signUp when !isAuth and form submitted clicked", async () => {
    const wrapper = factory();
    wrapper.vm.isAuth = false;
    // For whatever reasons triggering the form doesn't work
    await wrapper.vm.handleSubmit({
      email: "john.doe@gmail.com",
      password: "password",
    });

    expect(store.dispatch).toHaveBeenCalledWith("auth/signUp", {
      email: "john.doe@gmail.com",
      password: "password",
    });
    expect(wrapper.vm.isAuth).toBe(true);
  });
});
