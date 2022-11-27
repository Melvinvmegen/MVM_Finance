const {
  VueRouterMock,
  createRouterMock,
  injectRouterMock,
} = require("vue-router-mock");
const { config } = require("@vue/test-utils");
import axiosMock from "./tests/unit/mocks/axios";

// create one router per test file
const router = createRouterMock();

beforeEach(() => {
  axiosMock();
  injectRouterMock(router);
});

// Add properties to the wrapper
config.plugins.VueWrapper.install(VueRouterMock);
jest.setTimeout(30000);
