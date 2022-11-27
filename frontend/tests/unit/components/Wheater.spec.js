import Weather from "@/components/Weather";
import { shallowMount } from "@vue/test-utils";

describe("Weather.vue", () => {
  xit("Input keypress enter triggers fetchWeather", async () => {
    const wrapper = shallowMount(Weather);
    wrapper.vm.fetchWeather = jest.fn();
    await wrapper.find(".search-bar").trigger("keyup", { key: "Enter" });

    expect(wrapper.vm.fetchWeather).toHaveBeenCalled();
    expect(wrapper.vm.isFetching).toBeTruthy();
  });
});
