import { quotations } from "@/store/quotations.ts";

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

describe("Quotations store index", () => {
  it("getQuotations without query returns all", async () => {
    const commit = jest.fn();
    await quotations.actions.getQuotations({ commit });

    expect(url).toBe("quotations");
    expect(commit).toHaveBeenCalledWith("setQuotations", undefined);
  });

  it("getQuotations with query returns filtered query", async () => {
    const commit = jest.fn();
    const query = {
      currentPage: 1,
      perPage: 12,
    };
    await quotations.actions.getQuotations({ commit }, query);

    expect(url).toBe("quotations");
    expect(body.params).toEqual(query);
    expect(commit).toHaveBeenCalledWith("setQuotations", query);
  });

  it("fills quotations to the state as state changed", () => {
    const quotationsData = {
      rows: [{ id: 1 }, { id: 2 }],
      count: 2,
    };
    const state = {
      quotations: [],
    };

    quotations.mutations.setQuotations(state, quotationsData);

    expect(state).toEqual({ count: 2, quotations: [{ id: 1 }, { id: 2 }] });
  });
});

describe("Quotations store show", () => {
  it("getQuotation with id returns true", async () => {
    const commit = jest.fn();
    const quotationId = 1;
    await quotations.actions.getQuotation({ commit }, quotationId);

    expect(url).toBe(`quotation/${quotationId}`);
  });

  it("getQuotation without id returns error", async () => {
    const commit = jest.fn();
    mockError = true;

    await expect(
      quotations.actions.getQuotation({ commit }, {})
    ).rejects.toThrow("API Error occurred.");
  });
});

describe("Quotations store create", () => {
  const quotationData = {
    firstName: "John",
    lastName: "Doe",
    Quotations: undefined,
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
  it("createQuotation with id returns response data", async () => {
    mockError = false;
    const commit = jest.fn();

    await quotations.actions.createQuotation({ commit }, quotationData);
    expect(url).toBe("quotation");
    expect(body).toEqual(quotationData);
    expect(commit).toHaveBeenCalled();
  });

  it("adds a quotation to the state", () => {
    const quotation = { id: 1, quotationData };
    const state = {
      quotations: [],
    };

    quotations.mutations.addQuotation(state, quotation);

    expect(state).toEqual({
      quotations: [quotation],
    });
  });
});

describe("Quotations store update", () => {
  it("updateQuotation with id returns quotationData", async () => {
    const commit = jest.fn();
    const quotationId = 1;
    const quotationData = {
      id: quotationId,
      firstName: "John",
      lastName: "Doe",
    };

    await quotations.actions.updateQuotation({ commit }, quotationData);
    expect(url).toBe(`quotation/${quotationId}`);
    expect(body).toEqual(quotationData);
    expect(commit).toHaveBeenCalled();
  });
});

describe("Quotations store delete", () => {
  it("deleteQuotation with id returns quotationData", async () => {
    const commit = jest.fn();
    const quotationId = 1;

    await quotations.actions.deleteQuotation({ commit }, quotationId);
    expect(url).toBe(`quotation/${quotationId}`);
    expect(commit).toHaveBeenCalledWith("deleteQuotation", quotationId);
  });
});
