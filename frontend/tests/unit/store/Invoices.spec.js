import { invoices } from "@/store/invoices.ts";

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

describe("Invoices store index", () => {
  it("getInvoices without query returns all", async () => {
    const commit = jest.fn();
    await invoices.actions.getInvoices({ commit });

    expect(url).toBe("invoices");
    expect(commit).toHaveBeenCalledWith("setInvoices", undefined);
  });

  it("getInvoices with query returns filtered query", async () => {
    const commit = jest.fn();
    const query = {
      currentPage: 1,
      perPage: 12,
    };
    await invoices.actions.getInvoices({ commit }, query);

    expect(url).toBe("invoices");
    expect(body.params).toEqual(query);
    expect(commit).toHaveBeenCalledWith("setInvoices", query);
  });

  it("fills invoices to the state as state changed", () => {
    const invoicesData = {
      rows: [{ id: 1 }, { id: 2 }],
      count: 2,
    };
    const state = {
      invoices: [],
    };

    invoices.mutations.setInvoices(state, invoicesData);
    expect(state).toEqual({
      invoices: [{ id: 1 }, { id: 2 }],
      count: 2,
    });
  });
});

describe("Invoices store show", () => {
  it("getInvoice with id returns true", async () => {
    const commit = jest.fn();
    const invoiceId = 1;
    await invoices.actions.getInvoice({ commit }, invoiceId);

    expect(url).toBe(`invoice/${invoiceId}`);
  });

  it("getInvoice without id returns error", async () => {
    const commit = jest.fn();
    mockError = true;

    await expect(invoices.actions.getInvoice({ commit }, {})).rejects.toThrow(
      "API Error occurred."
    );
  });
});

describe("Invoices store create", () => {
  const invoiceData = {
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
  it("createInvoice with id returns invoiceData", async () => {
    mockError = false;
    const commit = jest.fn();

    await invoices.actions.createInvoice({ commit }, invoiceData);
    expect(url).toBe("invoice");
    expect(body).toEqual(invoiceData);
    expect(commit).toHaveBeenCalled();
  });

  it("adds a invoice to the state", () => {
    const invoice = { id: 1, ...invoiceData };
    const state = {
      invoices: [],
    };

    invoices.mutations.addInvoice(state, invoice);

    expect(state).toEqual({
      invoices: [{ id: 1, ...invoiceData }],
    });
  });
});

describe("Invoices store update", () => {
  it("updateInvoice with id returns invoiceData", async () => {
    const commit = jest.fn();
    const invoiceId = 1;
    const invoiceData = {
      id: invoiceId,
      firstName: "John",
      lastName: "Doe",
    };

    await invoices.actions.updateInvoice({ commit }, invoiceData);
    expect(url).toBe(`invoice/${invoiceId}`);
    expect(body).toEqual(invoiceData);
    expect(commit).toHaveBeenCalled();
  });
});

describe("Invoices store delete", () => {
  it("deleteInvoice with id returns invoiceData", async () => {
    const commit = jest.fn();
    const invoiceId = 1;

    await invoices.actions.deleteInvoice({ commit }, invoiceId);
    expect(url).toBe(`invoice/${invoiceId}`);
    expect(commit).toHaveBeenCalledWith("deleteInvoice", invoiceId);
  });
});
