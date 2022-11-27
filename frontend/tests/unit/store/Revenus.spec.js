import { revenus } from "@/store/revenus.ts";

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

describe("Revenus store index", () => {
  it("getRevenus without query returns all", async () => {
    const commit = jest.fn();
    await revenus.actions.getRevenus({ commit });

    expect(url).toBe("revenus");
    expect(commit).toHaveBeenCalledWith("setRevenus", {});
  });

  it("getRevenus with query returns filtered query", async () => {
    const commit = jest.fn();
    const query = {
      currentPage: 1,
      perPage: 12,
    };
    await revenus.actions.getRevenus({ commit }, query);

    expect(url).toBe("revenus");
    expect(body.params).toEqual(query);
    expect(commit).toHaveBeenCalledWith("setRevenus", query);
  });

  it("fills revenus to the state as state changed", () => {
    const revenusData = {
      rows: [{ id: 1 }, { id: 2 }],
      count: 2,
    };
    const state = {
      revenus: [],
    };

    revenus.mutations.setRevenus(state, revenusData);

    expect(state).toEqual({
      revenus: [{ id: 1 }, { id: 2 }],
      count: 2,
    });
  });
});

describe("Revenus store show", () => {
  it("getRevenu with id returns true", async () => {
    const commit = jest.fn();
    const revenuId = 1;
    await revenus.actions.getRevenu({ commit }, revenuId);

    expect(url).toBe(`revenu/${revenuId}`);
  });

  it("getRevenu without id returns error", async () => {
    const commit = jest.fn();
    mockError = true;

    await expect(revenus.actions.getRevenu({ commit }, {})).rejects.toThrow(
      "API Error occurred."
    );
  });
});

describe("Revenus store update", () => {
  it("updateRevenu with id returns revenuData", async () => {
    mockError = false;
    const commit = jest.fn();
    const revenuId = 1;
    const revenuData = {
      id: revenuId,
      firstName: "John",
      lastName: "Doe",
    };

    await revenus.actions.updateRevenu({ commit }, revenuData);
    expect(url).toBe(`revenu/${revenuId}`);
    expect(body).toEqual(revenuData);
    expect(commit).toHaveBeenCalled();
  });
});
