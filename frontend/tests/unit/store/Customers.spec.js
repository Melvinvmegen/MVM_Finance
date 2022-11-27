import { customers } from "@/store/customers.ts";

let url = "";
let body = {};
let mockError = false;

jest.mock("@/services/api.ts", () => ({
  get: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body.params });
    });
  },
  post: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body });
    });
  },
  put: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body });
    });
  },
  delete: (_url, _body) => {
    return new Promise((resolve) => {
      if (mockError) throw Error("API Error occurred.");
      url = _url;
      body = _body;

      resolve({ data: _body });
    });
  },
}));

describe("Customers store index", () => {
  it("getCustomers without query returns all", async () => {
    const commit = jest.fn();
    await customers.actions.getCustomers({ commit });

    expect(url).toBe("customers");
    expect(commit).toHaveBeenCalledWith("setCustomers", undefined);
  });

  it("getCustomers with query returns filtered query", async () => {
    const commit = jest.fn();
    const query = {
      currentPage: 1,
      perPage: 12,
    };
    await customers.actions.getCustomers({ commit }, query);

    expect(url).toBe("customers");
    expect(body.params).toEqual(query);
    expect(commit).toHaveBeenCalledWith("setCustomers", query);
  });

  it("fills customers to the state as state changed", () => {
    const customersData = {
      rows: [{ id: 1 }, { id: 2 }],
      count: 2,
    };
    const state = {
      customers: [],
    };

    customers.mutations.setCustomers(state, customersData);

    expect(state).toEqual({
      customers: [{ id: 1 }, { id: 2 }],
      count: 2,
    });
  });
});

describe("Customers store show", () => {
  it("getCustomer with id returns true", async () => {
    const commit = jest.fn();
    const customerId = 1;
    await customers.actions.getCustomer({ commit }, customerId);

    expect(url).toBe(`customer/${customerId}`);
  });

  it("getCustomer without id returns error", async () => {
    const commit = jest.fn();
    mockError = true;

    await expect(customers.actions.getCustomer({ commit }, {})).rejects.toThrow(
      "API Error occurred."
    );
  });
});

describe("Customers store create", () => {
  const customerData = {
    firstName: "John",
    lastName: "Doe",
    Invoices: undefined,
    address: undefined,
    city: undefined,
    company: undefined,
    email: undefined,
    firstName: undefined,
    id: undefined,
    lastName: undefined,
    phone: undefined,
    siret: undefined,
  };
  it("createCustomer with id returns response data", async () => {
    mockError = false;
    const commit = jest.fn();

    await customers.actions.createCustomer({ commit }, customerData);
    expect(url).toBe("customer");
    expect(body).toEqual(customerData);
    expect(commit).toHaveBeenCalled();
  });

  it("adds a customer to the state", () => {
    const customer = { id: 1, ...customerData };
    const state = {
      customers: [],
    };

    customers.mutations.addCustomer(state, { customer });

    expect(state).toEqual({
      customers: [{ customer: { id: 1, ...customerData } }],
    });
  });
});

describe("Customers store update", () => {
  it("updateCustomer with id returns customerData", async () => {
    const commit = jest.fn();
    const customerId = 1;
    const customerData = {
      id: customerId,
      firstName: "John",
      lastName: "Doe",
    };

    await customers.actions.updateCustomer({ commit }, customerData);
    expect(url).toBe(`customer/${customerId}`);
    expect(body).toEqual(customerData);
    expect(commit).toHaveBeenCalled();
  });
});

describe("Customers store delete", () => {
  it("deleteCustomer with id returns customerData", async () => {
    const commit = jest.fn();
    const customerId = 1;

    await customers.actions.deleteCustomer({ commit }, customerId);
    expect(url).toBe(`customer/${customerId}`);
    expect(commit).toHaveBeenCalledWith("deleteCustomer", customerId);
  });
});
